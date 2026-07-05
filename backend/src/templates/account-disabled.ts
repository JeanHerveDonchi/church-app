export const accountDisabledTemplate = () => ({
  subject: "Information concernant votre acces THC Global",
  html: `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1c1917">
      <h1 style="font-size:20px;font-weight:600;margin:0 0 16px">Information</h1>
      <p style="color:#57534e;line-height:1.6;margin:0 0 16px">
        Un changement a ete apporte a votre acces sur l'application THC Global.
      </p>
      <p style="color:#57534e;line-height:1.6;margin:0 0 16px">
        Si vous avez des questions concernant cette modification, n'hesitez pas a nous contacter.
      </p>
      <hr style="border:none;border-top:1px solid #e7e5e4;margin:24px 0"/>
      <p style="font-size:12px;color:#a8a29e;margin:0">THC Global</p>
    </div>
  `,
})