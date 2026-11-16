// Activity 6: accounts now live in the backend database with bcrypt-hashed passwords.
// SECURITY: No passwords are bundled in the frontend any more. This list only tells the
// classroom demo which seeded accounts exist; their passwords are in backend/README.md.
export const demoAccounts = Object.freeze([
  Object.freeze({ name: 'Ali Demo', email: 'patient@example.com', role: 'patient' }),
  Object.freeze({ name: 'Zara Demo', email: 'other.patient@example.com', role: 'patient' }),
  Object.freeze({ name: 'Dr Sara Demo', email: 'doctor@example.com', role: 'doctor' }),
]);

export function dashboardPath(role) {
  return role === 'patient' ? '/patient' : role === 'doctor' ? '/doctor' : '/login';
}
