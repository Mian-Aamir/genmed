// Where each role lands after logging in. Roles come from the server (JWT + database),
// never from the browser.
export function dashboardPath(role) {
  return role === 'patient' ? '/patient' : role === 'doctor' ? '/doctor' : '/login';
}
