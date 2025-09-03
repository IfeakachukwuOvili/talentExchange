export interface PasswordValidation {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong'
}

export const validatePassword = (password: string): PasswordValidation => {
  const errors: string[] = []
  
  if (password.length < 8) errors.push('At least 8 characters')
  if (!/[A-Z]/.test(password)) errors.push('One uppercase letter')
  if (!/[a-z]/.test(password)) errors.push('One lowercase letter')
  if (!/\d/.test(password)) errors.push('One number')
  if (!/[!@#$%^&*]/.test(password)) errors.push('One special character (!@#$%^&*)')
  
  const strength = errors.length === 0 ? 'strong' : errors.length <= 2 ? 'medium' : 'weak'
  
  return {
    isValid: errors.length === 0,
    errors,
    strength
  }
}