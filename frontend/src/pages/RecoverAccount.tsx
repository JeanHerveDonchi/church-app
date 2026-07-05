import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/providers/authProvider'
import { recoverAccount, getRecoveryErrorMessage } from '@/services/recovery.service'
import { supabase } from '@/providers/supabaseClient'
import { AlertCircle } from 'lucide-react'

export const RecoverAccountPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRecover = async () => {
    if (!user?.email) return

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await recoverAccount(user.id, user.email)

      if (result.success) {
        await supabase.auth.signOut()
        navigate('/login', { state: { recovered: true } })
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

  const handleCancel = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-6 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Compte desactive</h1>
          <p className="text-gray-600 mb-6">
            Connectez-vous pour restaurer votre compte.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Se connecter
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-2">Compte desactive</h1>
        <p className="text-gray-600 mb-6">
          Il semble que votre compte a ete desactive. Souhaitez-vous le restaurer ?
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => { void handleRecover() }}
            disabled={isSubmitting}
            className="w-full px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Restauration en cours...' : 'Restaurer mon compte'}
          </button>

          <button
            onClick={() => { void handleCancel() }}
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
