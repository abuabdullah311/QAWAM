import React, { useState, useEffect } from 'react';
import { supabase } from '../library/supabaseClient';
import { UserProfile, UserRole } from '../types';
import { X, Shield, UserX, Key, Plus, Loader2, Database, AlertCircle, Edit2 } from 'lucide-react';

interface UserManagementModalProps {
  onClose: () => void;
  currentUser: UserProfile;
}

export function UserManagementModal({ onClose, currentUser }: UserManagementModalProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // New user form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [newUsername, setNewUsername] = useState('');

  // Editing username
  const [editingUsernameId, setEditingUsernameId] = useState<string | null>(null);
  const [editUsernameVal, setEditUsernameVal] = useState('');

  // Change password form
  const [userToChangePassword, setUserToChangePassword] = useState<string | null>(null);
  const [changePasswordValue, setChangePasswordValue] = useState('');

  // SQL Helper
  const [showSqlGuide, setShowSqlGuide] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      alert('تعذر جلب المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('create');
    try {
      const { data, error } = await supabase.rpc('create_user_by_admin', {
        email_param: newEmail,
        password_param: newPassword,
        role_param: newRole,
        username_param: newUsername || null
      });

      if (error) throw error;
      
      setNewEmail('');
      setNewPassword('');
      setNewUsername('');
      setShowAddForm(false);
      fetchUsers();
    } catch (err: any) {
      console.error('Error creating user:', err);
      alert('خطأ في إنشاء المستخدم: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateRole = async (id: string, newRole: UserRole) => {
    setActionLoading(`role_${id}`);
    try {
      const { error } = await supabase.rpc('update_user_role_by_admin', {
        user_id_param: id,
        new_role_param: newRole
      });

      if (error) throw error;
      
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
    } catch (err: any) {
      alert('خطأ في تحديث الصلاحية: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateUsernameAdmin = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    setActionLoading(`user_${id}`);
    try {
      const { error } = await supabase.rpc('update_username', {
        user_id_param: id,
        new_username: editUsernameVal
      });

      if (error) throw error;
      
      setUsers(users.map(u => u.id === id ? { ...u, username: editUsernameVal } : u));
      setEditingUsernameId(null);
      setEditUsernameVal('');
    } catch (err: any) {
      alert('خطأ في تحديث اسم المستخدم: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم نهائياً؟')) return;
    
    setActionLoading(`delete_${id}`);
    try {
      const { error } = await supabase.rpc('delete_user_by_admin', {
        user_id_param: id
      });

      if (error) throw error;
      
      setUsers(users.filter(u => u.id !== id));
    } catch (err: any) {
      alert('خطأ في الحذف: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangePassword = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    setActionLoading(`pass_${id}`);
    try {
      const { error } = await supabase.rpc('update_user_password_by_admin', {
        user_id_param: id,
        new_password_param: changePasswordValue
      });

      if (error) throw error;
      
      setUserToChangePassword(null);
      setChangePasswordValue('');
      alert('تم تغيير كلمة المرور بنجاح');
    } catch (err: any) {
      alert('خطأ في تغيير كلمة المرور: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const sqlCode = `
-- 0. Enable pgcrypto for password hashing
create extension if not exists pgcrypto;

-- 1. Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  username text,
  role text not null default 'user' check (role in ('admin', 'editor', 'user')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_login timestamp with time zone
);

-- Add username column if it doesn't exist (for existing tables)
alter table public.profiles add column if not exists username text;

-- 2. RLS Policies
alter table public.profiles enable row level security;

-- Drop existing policies if any
drop policy if exists "Authenticated can view all profiles." on profiles;
drop policy if exists "Users can update own profile." on profiles;

-- Prevent infinite recursion by allowing all authenticated users to read profiles
create policy "Authenticated can view all profiles." on profiles
  for select using (auth.role() = 'authenticated');

-- To prevent recursion on update, we use a subquery that doesn't trigger policy or just allow users to update their own, and admins can use RPC to manage users.
create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- (Admins update other profiles via security definer RPCs, so we don't need an update policy for admins here)

-- 3. Trigger to insert profile on signup
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user cascade;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username, role)
  values (new.id, new.email, new.raw_user_meta_data->>'username', 'user');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. RPC to create user by admin
create or replace function public.create_user_by_admin(email_param text, password_param text, role_param text, username_param text default null)
returns uuid
language plpgsql
security definer
as $$
declare
  new_user_id uuid;
begin
  -- Ensure caller is admin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Unauthorized';
  end if;

  -- Create auth user
  -- Note: Depending on Supabase version, direct insert into auth.users might be restricted or require specific extensions/APIs.
  -- A robust way in postgres for older systems was standard insert, but Supabase provides dedicated functions now.
  -- If this fails, use Edge Functions. But for simplicity, we insert directly or use auth functions.
  -- Actually, supabase allows admins to use auth.users if security definer is used.
  
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', email_param, crypt(password_param, gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', coalesce(jsonb_build_object('username', username_param), '{}'::jsonb), now(), now(), '', '', '', '')
  returning id into new_user_id;

  -- Update role and username in profile
  update public.profiles set role = role_param, username = username_param where id = new_user_id;
  
  return new_user_id;
end;
$$;

-- 5. RPC to delete user
create or replace function public.delete_user_by_admin(user_id_param uuid)
returns void
language plpgsql
security definer
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Unauthorized';
  end if;

  delete from auth.users where id = user_id_param;
end;
$$;

-- 6. RPC to update password
create or replace function public.update_user_password_by_admin(user_id_param uuid, new_password_param text)
returns void
language plpgsql
security definer
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Unauthorized';
  end if;

  update auth.users
  set encrypted_password = crypt(new_password_param, gen_salt('bf'))
  where id = user_id_param;
end;
$$;

-- 7. Page Views Counter
create table if not exists public.site_stats (
  id integer primary key default 1,
  views_count integer not null default 0
);

insert into public.site_stats (id, views_count) values (1, 12500) on conflict (id) do nothing;

create or replace function public.increment_page_view()
returns integer
language plpgsql
security definer
as $$
declare
  new_count integer;
begin
  update public.site_stats 
  set views_count = views_count + 1 
  where id = 1 
  returning views_count into new_count;
  
  return new_count;
end;
$$;

-- 8. RPC to update role
create or replace function public.update_user_role_by_admin(user_id_param uuid, new_role_param text)
returns void
language plpgsql
security definer
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Unauthorized';
  end if;

  update public.profiles
  set role = new_role_param
  where id = user_id_param;
end;
$$;

-- 9. RPC to update username
create or replace function public.update_username(user_id_param uuid, new_username text)
returns void
language plpgsql
security definer
as $$
begin
  -- Check if caller is the user themselves or an admin
  if auth.uid() != user_id_param and not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Unauthorized';
  end if;

  update public.profiles
  set username = new_username
  where id = user_id_param;
  
  update auth.users 
  set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('username', new_username) 
  where id = user_id_param;
end;
$$;
`;

  if (currentUser.role !== 'admin') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-[#000000]/40 backdrop-blur-md flex items-center justify-center z-[100] p-4 sm:p-6 pb-20 sm:pb-6" dir="rtl">
      <div className="bg-white/95 backdrop-blur-3xl w-full max-w-5xl rounded-[24px] sm:rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] flex flex-col h-full sm:h-auto max-h-[85vh] sm:max-h-[90vh] overflow-hidden border border-white/20">
        
        {/* Header */}
        <div className="flex justify-between items-center px-5 sm:px-8 py-4 sm:py-6 border-b border-slate-200/50 bg-white/50 relative">
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h2 className="text-[20px] sm:text-[24px] font-bold text-slate-900 tracking-tight">إدارة المستخدمين</h2>
              <span className="text-[10px] sm:text-[11px] font-bold bg-[#007AFF]/10 text-[#007AFF] px-2 sm:px-2.5 py-1 rounded-full uppercase tracking-wider">لوحة المشرف</span>
            </div>
            <p className="text-[12px] sm:text-[14px] text-slate-500 font-medium tracking-tight">قم بإدارة أعضاء النظام وصلاحياتهم بثقة.</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button
              onClick={() => setShowSqlGuide(true)}
              className="text-[11px] sm:text-[13px] bg-slate-900 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-[12px] flex items-center gap-1.5 sm:gap-2 hover:bg-black transition-colors font-semibold shadow-sm active:scale-95"
            >
              <Database size={16} strokeWidth={1.5} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">إصلاح المزامنة</span>
              <span className="sm:hidden">إصلاح</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors bg-black/5 hover:bg-black/10 p-2 sm:p-2.5 rounded-full active:scale-95">
              <X size={20} strokeWidth={2} className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-8 overflow-y-auto flex-1 hide-scrollbar">
          
          <div className="flex justify-end mb-4 sm:mb-6">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-[#007AFF] text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-[12px] sm:rounded-[16px] flex items-center gap-1.5 sm:gap-2 text-[12px] sm:text-[14px] font-semibold hover:bg-[#0062cc] transition-all shadow-[0_2px_12px_rgba(0,122,255,0.2)] active:scale-95"
            >
              <Plus size={18} strokeWidth={2} className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              إضافة عضو جديد
            </button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="bg-slate-50/50 border border-slate-200/60 p-4 sm:p-6 rounded-[16px] sm:rounded-[24px] mb-6 sm:mb-8 animate-in fade-in slide-in-from-top-2">
              <h3 className="text-[14px] sm:text-[15px] font-bold text-slate-800 mb-4 sm:mb-5 flex items-center gap-2">
                <UserProfileIcon role="admin" />
                إنشاء حساب جديد
              </h3>
              <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-5 gap-3 sm:gap-5 items-end">
                <div className="flex flex-col gap-1 sm:gap-1.5 md:col-span-1">
                  <label className="text-[11px] sm:text-[13px] font-semibold text-slate-500 uppercase tracking-wider px-1">اسم المستخدم</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    className="w-full text-[13px] sm:text-[15px] px-3 py-2.5 sm:px-4 sm:py-3 bg-white border border-slate-200/80 rounded-[12px] sm:rounded-[16px] focus:ring-4 focus:ring-[#007AFF]/10 focus:border-[#007AFF] outline-none transition-all shadow-sm"
                    placeholder="اسم المستخدم"
                  />
                </div>
                <div className="flex flex-col gap-1 sm:gap-1.5 md:col-span-1">
                  <label className="text-[11px] sm:text-[13px] font-semibold text-slate-500 uppercase tracking-wider px-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    required
                    dir="ltr"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full text-[13px] sm:text-[15px] px-3 py-2.5 sm:px-4 sm:py-3 bg-white border border-slate-200/80 rounded-[12px] sm:rounded-[16px] focus:ring-4 focus:ring-[#007AFF]/10 focus:border-[#007AFF] outline-none transition-all shadow-sm"
                    placeholder="user@example.com"
                  />
                </div>
                <div className="flex flex-col gap-1 sm:gap-1.5 md:col-span-1">
                  <label className="text-[11px] sm:text-[13px] font-semibold text-slate-500 uppercase tracking-wider px-1">كلمة المرور</label>
                  <input
                    type="password"
                    required
                    dir="ltr"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full text-[13px] sm:text-[15px] px-3 py-2.5 sm:px-4 sm:py-3 bg-white border border-slate-200/80 rounded-[12px] sm:rounded-[16px] focus:ring-4 focus:ring-[#007AFF]/10 focus:border-[#007AFF] outline-none transition-all shadow-sm tracking-widest"
                    placeholder="••••••"
                  />
                </div>
                <div className="flex flex-col gap-1 sm:gap-1.5 md:col-span-1">
                  <label className="text-[11px] sm:text-[13px] font-semibold text-slate-500 uppercase tracking-wider px-1">الصلاحية</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as UserRole)}
                    className="w-full text-[13px] sm:text-[15px] px-3 py-2.5 sm:px-4 sm:py-3 bg-white border border-slate-200/80 rounded-[12px] sm:rounded-[16px] focus:ring-4 focus:ring-[#007AFF]/10 focus:border-[#007AFF] outline-none transition-all shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="user">مستخدم (User)</option>
                    <option value="editor">محرر (Editor)</option>
                    <option value="admin">مشرف (Admin)</option>
                  </select>
                </div>
                <div className="md:col-span-1 mt-2 sm:mt-0">
                   <button
                     type="submit"
                     disabled={actionLoading === 'create'}
                     className="w-full bg-[#1c1c1e] text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-[12px] sm:rounded-[16px] text-[13px] sm:text-[15px] font-semibold hover:bg-black transition-all shadow-sm flex items-center justify-center active:scale-95 disabled:opacity-50"
                   >
                     {actionLoading === 'create' ? <Loader2 size={20} className="animate-spin w-4 h-4 sm:w-5 sm:h-5" /> : 'إنشاء'}
                   </button>
                </div>
              </form>
            </div>
          )}

          {/* Table */}
          <div className="border border-slate-200/60 rounded-[16px] sm:rounded-[24px] overflow-hidden bg-white/50 shadow-sm relative">
            {loading ? (
              <div className="p-8 sm:p-16 flex justify-center text-slate-400">
                <Loader2 size={28} className="animate-spin w-6 h-6 sm:w-7 sm:h-7" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[12px] sm:text-[14px] text-start min-w-[800px]">
                  <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200/60 text-[11px] sm:text-[12px] uppercase tracking-widest">
                    <tr>
                      <th className="font-semibold px-4 sm:px-6 py-3 sm:py-4 text-start">المستخدم</th>
                      <th className="font-semibold px-4 sm:px-6 py-3 sm:py-4 text-start">البريد الإلكتروني</th>
                      <th className="font-semibold px-4 sm:px-6 py-3 sm:py-4 text-start">الصلاحية</th>
                      <th className="font-semibold px-4 sm:px-6 py-3 sm:py-4 text-start">تاريخ الانضمام</th>
                      <th className="font-semibold px-4 sm:px-6 py-3 sm:py-4 text-start">آخر دخول</th>
                      <th className="font-semibold px-4 sm:px-6 py-3 sm:py-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-black/5 transition-colors group">
                        <td className="px-6 py-4 font-semibold text-slate-900 text-start">
                          <div className="flex items-center gap-2">
                             {editingUsernameId === user.id ? (
                               <form onSubmit={(e) => handleUpdateUsernameAdmin(e, user.id)} className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-[12px] border border-slate-200/80">
                                 <input
                                   type="text"
                                   required
                                   value={editUsernameVal}
                                   onChange={e => setEditUsernameVal(e.target.value)}
                                   placeholder="اسم جديد"
                                   className="w-[100px] text-[13px] px-3 py-1.5 border border-slate-200 rounded-[8px] bg-white outline-none focus:border-[#007AFF]"
                                 />
                                 <button type="submit" disabled={actionLoading === `user_${user.id}`} className="text-[#34C759] bg-[#34C759]/10 p-1.5 rounded-[8px] hover:bg-[#34C759]/20 transition-all active:scale-95">
                                   {actionLoading === `user_${user.id}` ? <Loader2 size={16} className="animate-spin" /> : '✓'}
                                 </button>
                                 <button type="button" onClick={() => setEditingUsernameId(null)} className="text-slate-400 bg-slate-100 p-1.5 rounded-[8px] hover:bg-slate-200 transition-all active:scale-95">
                                   <X size={16} />
                                 </button>
                               </form>
                             ) : (
                               <>
                                 <span>{user.username || '-'}</span>
                                 <button
                                   onClick={() => {
                                     setEditingUsernameId(user.id);
                                     setEditUsernameVal(user.username || '');
                                   }}
                                   title="تعديل اسم المستخدم"
                                   className="text-slate-400 hover:text-[#007AFF] transition-colors p-1 rounded-full opacity-0 group-hover:opacity-100 bg-slate-100 hover:bg-[#007AFF]/10 active:scale-95"
                                 >
                                   <Edit2 size={14} strokeWidth={1.5} />
                                 </button>
                               </>
                             )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700 text-start">
                          <div className="flex items-center gap-2">
                             {user.email}
                             {user.id === currentUser.id && (
                               <span className="text-[10px] bg-[#007AFF]/10 text-[#007AFF] px-2 py-0.5 rounded-[6px] font-bold">أنت</span>
                             )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-start">
                          <select
                            disabled={user.id === currentUser.id || actionLoading?.startsWith('role_')}
                            value={user.role}
                            onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole)}
                            className="text-[13px] font-medium bg-slate-100/50 border border-slate-200/80 rounded-[8px] px-3 py-1.5 outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 disabled:opacity-50 transition-all cursor-pointer"
                          >
                            <option value="user">مستخدم</option>
                            <option value="editor">محرر</option>
                            <option value="admin">مشرف</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-[13px] font-medium text-start" dir="ltr">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-[13px] font-medium text-start" dir="ltr">
                          {user.last_login ? new Date(user.last_login).toLocaleString() : 'لم يدخل بعد'}
                        </td>
                        <td className="px-6 py-4 text-center">
                           <div className="flex justify-center items-center gap-2">
                          {userToChangePassword === user.id ? (
                            <form onSubmit={(e) => handleChangePassword(e, user.id)} className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-[12px] border border-slate-200/80">
                              <input
                                type="password"
                                required
                                value={changePasswordValue}
                                onChange={e => setChangePasswordValue(e.target.value)}
                                placeholder="جديدة..."
                                className="w-[100px] text-[13px] px-3 py-1.5 border border-slate-200 rounded-[8px] bg-white outline-none focus:border-[#007AFF]"
                                dir="ltr"
                              />
                              <button type="submit" disabled={actionLoading === `pass_${user.id}`} className="text-[#34C759] bg-[#34C759]/10 p-1.5 rounded-[8px] hover:bg-[#34C759]/20 transition-all active:scale-95">
                                {actionLoading === `pass_${user.id}` ? <Loader2 size={16} className="animate-spin" /> : '✓'}
                              </button>
                              <button type="button" onClick={() => setUserToChangePassword(null)} className="text-slate-400 bg-slate-100 p-1.5 rounded-[8px] hover:bg-slate-200 transition-all active:scale-95">
                                <X size={16} />
                              </button>
                            </form>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => setUserToChangePassword(user.id)}
                                title="تغيير كلمة المرور"
                                className="text-slate-600 hover:text-[#007AFF] transition-colors p-2 rounded-full bg-slate-100 hover:bg-[#007AFF]/10 active:scale-95"
                              >
                                <Key size={16} strokeWidth={1.5} />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={user.id === currentUser.id || actionLoading === `delete_${user.id}`}
                                title="حذف الحساب"
                                className="text-slate-600 hover:text-[#FF3B30] transition-colors p-2 rounded-full bg-slate-100 hover:bg-[#FF3B30]/10 disabled:opacity-30 disabled:hover:text-slate-600 disabled:hover:bg-slate-100 active:scale-95"
                              >
                                {actionLoading === `delete_${user.id}` ? <Loader2 size={16} className="animate-spin" /> : <UserX size={16} strokeWidth={1.5} />}
                              </button>
                            </div>
                          )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SQL Guide Modal */}
      {showSqlGuide && (
        <div className="fixed inset-0 bg-[#000000]/60 z-[60] flex items-center justify-center p-4 backdrop-blur-xl">
          <div className="bg-[#1c1c1e] w-full max-w-3xl rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center px-8 py-6 border-b border-white/5 bg-white/5">
               <div>
                 <h3 className="text-[20px] font-bold text-white tracking-tight">أكواد SQL المطلوبة</h3>
                 <p className="text-[13px] text-white/50 mt-1">انسخ هذه الأكواد وشغلها في SQL Editor الخاص بـ Supabase</p>
               </div>
               <button onClick={() => setShowSqlGuide(false)} className="text-white/40 hover:text-white p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors active:scale-95">
                 <X size={20} />
               </button>
            </div>
            <div className="p-8 flex-1 overflow-auto">
              <div className="bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF453A] px-5 py-4 rounded-[16px] text-[14px] mb-6 flex items-start gap-3">
                 <AlertCircle size={20} className="mt-0.5 shrink-0" strokeWidth={1.5} />
                 <p className="leading-relaxed">
                   <strong>تنبيه هام!</strong> تأكد من تعطيل خيار "Confirm Email" من إعدادات Authentication في Supabase لكي تتمكن من إنشاء مستخدمين بدون التحقق من البريد.
                 </p>
              </div>
              <pre className="bg-[#000000] p-6 rounded-[16px] text-white/80 text-[13px] font-mono whitespace-pre-wrap selection:bg-[#007AFF]/40 overflow-x-auto border border-white/5" dir="ltr">
                {sqlCode}
              </pre>
            </div>
            <div className="px-8 py-6 border-t border-white/5 bg-white/5 flex justify-start" dir="ltr">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sqlCode);
                  alert('تم النسخ!');
                }}
                className="bg-white text-black px-6 py-3 rounded-[16px] font-bold text-[14px] hover:bg-slate-200 transition-colors active:scale-95"
              >
                نسخ الكود بالكامل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserProfileIcon({ role }: { role: string }) {
  if (role === 'admin') return <Shield size={16} className="text-indigo-600" />;
  return <div className="w-4 h-4 bg-slate-200 rounded-full flex items-center justify-center text-[10px] text-slate-600 font-bold overflow-hidden">{role.charAt(0).toUpperCase()}</div>;
}
