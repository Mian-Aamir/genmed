// SECURITY: Public, fictional classroom credentials, not secrets or real accounts.
// Frontend credential matching is bypassable. Never deploy real passwords in this file.
// Roles are provisioned here, never accepted from a form or a role dropdown.
export const demoUsers = Object.freeze([
  Object.freeze({ id: 'patient-1', name: 'Ali Demo', email: 'patient@example.com', password: 'PatientDemo1!', role: 'patient' }),
  Object.freeze({ id: 'doctor-1', name: 'Dr Sara Demo', email: 'doctor@example.com', password: 'DoctorDemo1!', role: 'doctor' }),
]);

export function dashboardPath(role) {
  return role === 'patient' ? '/patient' : role === 'doctor' ? '/doctor' : '/login';
}
