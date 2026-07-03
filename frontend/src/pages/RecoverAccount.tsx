import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/providers/authProvider'
import { recoverAccount, getRecoveryErrorMessage } from '@/services/recovery.service'
import { fetchProfileByEmail } from '@/services/lifecycle.service'
import { CheckCircle2, AlertCircle } from 'lucide-react'

export const RecoverAccountPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEmailValid, setIsEmailValid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.currentTarget.value)
    setError(null)
  }

  const handleEmailBlur = async () => {
    if (!email.trim()) {
      setIsEmailValid(false)
      return
    }

    setIsValidating(true)
    try {
      const profile = await fetchProfileByEmail(email)
      const isValid = profile?.email?.toLowerCase().trim() === email.toLowerCase().trim()
      setIsEmailValid(isValid)

      if (!isValid) {
        setError('L\'adresse e-mail ne correspond pas.')
      } else {
        setError(null)
      }
    } catch {
      setIsEmailValid(false)
      setError('Erreur lors de la vérification. Veuillez réessayer.')
    } finally {
      setIsValidating(false)
    }
  }

  const handleRecover = async () => {
    if (!user || !isEmailValid) return

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await recoverAccount(user.id, email)

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          navigate('/')
        }, 2000)
      } else {
        const errorMessage = getRecoveryErrorMessage(result.error!)
        setError(errorMessage)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de la restauration'
      setError(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Accès refusé</h1>
          <p className="text-gray-600">Vous devez être connecté pour restaurer votre compte.</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Compte restauré</h1>
          <p className="text-gray-600">Redirection en cours...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-2">Restaurer votre compte</h1>
        <p className="text-gray-600 mb-6">Confirmez votre adresse e-mail pour restaurer votre compte supprimé.</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Adresse e-mail</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                placeholder="exemple@email.com"
                disabled={isSubmitting}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-100"
              />
              {isValidating && (
                <div className="absolute right-3 top-2.5">
                  <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-black rounded-full"></div>
                </div>
              )}
              {isEmailValid && !isValidating && (
                <CheckCircle2 className="absolute right-3 top-2.5 w-5 h-5 text-green-500" />
              )}
            </div>
          </div>

          <button
            onClick={handleRecover}
            disabled={!isEmailValid || isSubmitting || isValidating}
            className="w-full px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Restauration en cours...' : 'Restaurer mon compte'}
          </button>

          <button
            onClick={() => navigate('/login')}
            disabled={isSubmitting}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}
