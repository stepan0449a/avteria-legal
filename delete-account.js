'use strict';
// This is a publishable client key. No administrator key belongs in a public website.
const projectUrl = 'https://cirrkjnaroekwjlfduqk.supabase.co';
const publicKey = 'sb_publishable_XGnnX1KfgIvRnTrC_9LuuA_5YQPdV6U';
const form = document.getElementById('delete-form');
const status = document.getElementById('status');
const button = document.getElementById('submit');
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  if (!window.confirm('Permanently delete this Avteria account and its associated active data? This cannot be undone.')) return;
  button.disabled = true;
  status.textContent = 'Verifying your account and removing data. Keep this page open.';
  let accessToken = '';
  let password = document.getElementById('password').value;
  try {
    const login = await fetch(`${projectUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST', headers: { apikey: publicKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: document.getElementById('email').value.trim(), password }),
      cache: 'no-store',
    });
    const session = await login.json();
    if (!login.ok || !session.access_token) throw new Error('Could not sign in. Check your email and password, or contact support.');
    accessToken = session.access_token;
    const deletion = await fetch(`${projectUrl}/functions/v1/delete-account`, {
      method: 'POST', headers: { apikey: publicKey, Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, confirmation: 'DELETE' }), cache: 'no-store',
    });
    const result = await deletion.json();
    if (deletion.status === 202) {
      status.textContent = 'Some photos have been removed. More remain. Enter your password and press Delete account again to continue.';
      return;
    }
    if (!deletion.ok || result.deleted !== true) throw new Error(result.error || 'Deletion did not finish. Retry or contact support.');
    status.textContent = 'Your Avteria account and associated active data have been deleted. You can close this page.';
    form.reset(); form.hidden = true;
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : 'Connection failed. Please retry or contact support.';
  } finally {
    // Do not store credentials or tokens in cookies, localStorage, URLs or analytics.
    if (accessToken) {
      // Revoke the temporary web session if deletion failed. After deletion this may return 401.
      try { await fetch(`${projectUrl}/auth/v1/logout?scope=local`, {
        method: 'POST', headers: { apikey: publicKey, Authorization: `Bearer ${accessToken}` },
      }); } catch (_) { /* Session token was never persisted. */ }
    }
    accessToken = ''; password = '';
    document.getElementById('password').value = '';
    button.disabled = false;
  }
});
