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
      });

      if (error) throw error;
      
      setNewEmail('');
      setNewPassword('');
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
  role text not null default 'user' check (role in ('admin', 'editor', 'user')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_login timestamp with time zone
);

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
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. RPC to create user by admin
create or replace function public.create_user_by_admin(email_param text, password_param text, role_param text)
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
  values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', email_param, crypt(password_param, gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')
  returning id into new_user_id;

  -- Update role in profile
  update public.profiles set role = role_param where id = new_user_id;
  
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
`;

  if (currentUser.role !== 'admin') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-[#1c1c1e]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-['Almarai',sans-serif]" dir="rtl">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-800">إدارة المستخدمين</h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium">لوحة المشرف</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSqlGuide(true)}
              className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-indigo-100 transition-colors"
            >
              <Database size={14} />
              إصلاح المزامنة 🛠️
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 p-2 rounded-full hover:bg-slate-100">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-sm text-slate-500">قم بإدارة أعضاء النظام وصلاحياتهم بثقة.</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-[#007AFF] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-[#005bb5] transition-colors shadow-sm"
            >
              <Plus size={16} />
              إضافة عضو جديد
            </button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-xl mb-6">
              <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <UserProfileIcon role="admin" />
                إنشاء حساب جديد
              </h3>
              <form onSubmit={handleCreateUser} className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-slate-600 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    required
                    dir="ltr"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="user@example.com"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-slate-600 mb-1">كلمة المرور</label>
                  <input
                    type="password"
                    required
                    dir="ltr"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="••••••"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-medium text-slate-600 mb-1">الصلاحية</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as UserRole)}
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white"
                  >
                    <option value="user">مستخدم</option>
                    <option value="editor">محرر</option>
                    <option value="admin">مشرف</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={actionLoading === 'create'}
                  className="bg-[#2c2c2e] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-900 h-[38px] flex items-center min-w-[80px] justify-center"
                >
                  {actionLoading === 'create' ? <Loader2 size={16} className="animate-spin" /> : 'إنشاء'}
                </button>
              </form>
            </div>
          )}

          {/* Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
            {loading ? (
              <div className="p-10 flex justify-center text-slate-400">
                <Loader2 size={24} className="animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="font-semibold px-4 py-3">البريد الإلكتروني</th>
                      <th className="font-semibold px-4 py-3">الصلاحية</th>
                      <th className="font-semibold px-4 py-3">تاريخ الانضمام</th>
                      <th className="font-semibold px-4 py-3">آخر دخول</th>
                      <th className="font-semibold px-4 py-3 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {user.email}
                          {user.id === currentUser.id && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded mr-2 align-middle inline-block">أنت</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            disabled={user.id === currentUser.id || actionLoading?.startsWith('role_')}
                            value={user.role}
                            onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole)}
                            className="text-xs bg-slate-100 border border-slate-200 rounded px-2 py-1 outline-none focus:border-slate-300 disabled:opacity-50"
                          >
                            <option value="user">مستخدم (User)</option>
                            <option value="editor">محرر (Editor)</option>
                            <option value="admin">مشرف (Admin)</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs" dir="ltr">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs" dir="ltr">
                          {user.last_login ? new Date(user.last_login).toLocaleString() : 'لم يدخل بعد'}
                        </td>
                        <td className="px-4 py-3 flex gap-2 justify-center">
                          {userToChangePassword === user.id ? (
                            <form onSubmit={(e) => handleChangePassword(e, user.id)} className="flex items-center gap-1">
                              <input
                                type="password"
                                required
                                value={changePasswordValue}
                                onChange={e => setChangePasswordValue(e.target.value)}
                                placeholder="جديدة..."
                                className="w-24 text-xs px-2 py-1 border rounded"
                                dir="ltr"
                              />
                              <button type="submit" disabled={actionLoading === `pass_${user.id}`} className="text-green-600 bg-green-50 p-1 rounded hover:bg-green-100">
                                {actionLoading === `pass_${user.id}` ? <Loader2 size={14} className="animate-spin" /> : '✓'}
                              </button>
                              <button type="button" onClick={() => setUserToChangePassword(null)} className="text-slate-400 bg-slate-50 p-1 rounded hover:bg-slate-100">
                                <X size={14} />
                              </button>
                            </form>
                          ) : (
                            <>
                              <button
                                onClick={() => setUserToChangePassword(user.id)}
                                title="تغيير كلمة المرور"
                                className="text-slate-400 hover:text-slate-800 transition-colors p-1.5 rounded bg-white border border-transparent hover:border-slate-200"
                              >
                                <Key size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={user.id === currentUser.id || actionLoading === `delete_${user.id}`}
                                title="حذف الحساب"
                                className="text-slate-400 hover:text-red-600 transition-colors p-1.5 rounded bg-white hover:bg-red-50 border border-transparent hover:border-red-100 disabled:opacity-30 disabled:hover:bg-transparent"
                              >
                                {actionLoading === `delete_${user.id}` ? <Loader2 size={14} className="animate-spin" /> : <UserX size={14} />}
                              </button>
                            </>
                          )}
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
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-3xl rounded-xl shadow-2xl border border-slate-700 flex flex-col h-[80vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-800">
               <div>
                 <h3 className="text-lg font-bold text-slate-100">أكواد SQL المطلوبة</h3>
                 <p className="text-xs text-slate-400">انسخ هذه الأكواد وشغلها في SQL Editor الخاص بـ Supabase</p>
               </div>
               <button onClick={() => setShowSqlGuide(false)} className="text-slate-400 hover:text-white p-2">
                 <X size={20} />
               </button>
            </div>
            <div className="p-4 flex-1 overflow-auto">
              <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-lg text-sm mb-4 flex items-start gap-2">
                 <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
                 <p>
                   <strong>تنبيه هام!</strong> تأكد من تعطيل خيار "Confirm Email" من إعدادات Authentication في Supabase لكي تتمكن من إنشاء مستخدمين بدون التحقق من البريد.
                 </p>
              </div>
              <pre className="bg-[#0d1117] p-4 rounded-lg text-[#c9d1d9] text-sm font-mono whitespace-pre-wrap selection:bg-[#264f78]" dir="ltr">
                {sqlCode}
              </pre>
            </div>
            <div className="p-4 border-t border-slate-800 bg-slate-900/50 text-left" dir="ltr">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sqlCode);
                  alert('تم النسخ!');
                }}
                className="bg-slate-100 text-slate-900 px-4 py-2 rounded font-medium text-sm hover:bg-white"
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
