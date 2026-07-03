// Sent to a user when a super-admin disables their account
export const accountDisabledTemplate = () => ({
  subject: 'Votre compte THC Global a été désactivé',
  html: `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1c1917">
      <h1 style="font-size:20px;font-weight:600;margin:0 0 16px">Compte désactivé</h1>
      <p style="color:#57534e;line-height:1.6;margin:0 0 16px">
        Votre compte THC Global a été désactivé par un administrateur.
      </p>
      <p style="color:#57534e;line-height:1.6;margin:0 0 24px">
        Si vous pensez qu'il s'agit d'une erreur, veuillez contacter l'administration de THC Global.
      </p>
      <hr style="border:none;border-top:1px solid #e7e5e4;margin:24px 0"/>
      <p style="font-size:12px;color:#a8a29e;margin:0">THC Global</p>
    </div>
  `,
})
