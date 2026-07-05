export const welcomeTemplate = () => ({
  subject: 'Bienvenue sur THC Global',
  html: `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1c1917">
      <h1 style="font-size:20px;font-weight:600;margin:0 0 16px">Bienvenue dans la communaute</h1>
      <p style="color:#57534e;line-height:1.6;margin:0 0 16px">
        Merci d'avoir rejoint THC Global. Votre compte est desormais actif.
      </p>
      <p style="color:#57534e;line-height:1.6;margin:0 0 16px">
        Vous pouvez des a present acceder a toutes les publications, commenter et interagir avec la communaute.
      </p>
      <p style="color:#57534e;line-height:1.6;margin:0 0 24px">
        Nous vous recommandons de completer votre profil en ajoutant votre nom et en choisissant un avatar.
      </p>
      <hr style="border:none;border-top:1px solid #e7e5e4;margin:24px 0"/>
      <p style="font-size:12px;color:#a8a29e;margin:0">THC Global</p>
    </div>
  `,
})