import { createSiteClient, normalizeSupportUrl } from "./supabase-client.js";

const loginPanel = document.querySelector("#adminLogin");
const recoveryPanel = document.querySelector("#adminPasswordRecovery");
const dashboard = document.querySelector("#adminDashboard");
const deniedPanel = document.querySelector("#adminDenied");
const status = document.querySelector("#adminStatus");
const loginForm = document.querySelector("#adminLoginForm");
const resetRequestForm = document.querySelector("#adminPasswordResetRequest");
const recoveryForm = document.querySelector("#adminPasswordRecoveryForm");
const showPasswordReset = document.querySelector("#showPasswordReset");
const backToLogin = document.querySelector("#backToLogin");
const resourcesForm = document.querySelector("#adminResourcesForm");
const logoutButtons = document.querySelectorAll("[data-admin-logout]");
let isPasswordRecovery = false;

function showMessage(message, isError = false) {
  status.textContent = message;
  status.dataset.state = isError ? "error" : "success";
}

function hidePanels() {
  loginPanel.hidden = true;
  recoveryPanel.hidden = true;
  dashboard.hidden = true;
  deniedPanel.hidden = true;
}

async function startAdmin() {
  const supabase = await createSiteClient();

  supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") {
      isPasswordRecovery = true;
      hidePanels();
      recoveryPanel.hidden = false;
      showMessage("Choisis un nouveau mot de passe pour ton compte.");
    }
  });

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  async function showAuthenticatedView(session) {
    if (isPasswordRecovery) {
      hidePanels();
      recoveryPanel.hidden = false;
      return;
    }

    if (!session) {
      hidePanels();
      loginPanel.hidden = false;
      return;
    }

    const { data: isAdmin, error: accessError } = await supabase.rpc("is_education_admin");
    if (accessError) throw accessError;

    if (!isAdmin) {
      hidePanels();
      deniedPanel.hidden = false;
      showMessage("Ce compte n’est pas autorisé à modifier les liens de contact.", true);
      return;
    }

    const { data, error } = await supabase
      .from("site_support_channels")
      .select("id, url");
    if (error) throw error;

    const inputById = new Map(
      [...resourcesForm.querySelectorAll("[data-contact-id]")].map((input) => [
        input.dataset.contactId,
        input
      ])
    );

    for (const row of data) {
      const input = inputById.get(row.id);
      if (input) input.value = row.url;
    }

    hidePanels();
    dashboard.hidden = false;
    showMessage("Connecté. Tu peux gérer les liens de contact du site public.");
  }

  showPasswordReset.addEventListener("click", () => {
    loginForm.hidden = true;
    showPasswordReset.hidden = true;
    resetRequestForm.hidden = false;
    resetRequestForm.querySelector("#resetEmail").value =
      loginForm.querySelector("#adminEmail").value.trim();
    resetRequestForm.querySelector("#resetEmail").focus();
  });

  backToLogin.addEventListener("click", () => {
    resetRequestForm.hidden = true;
    loginForm.hidden = false;
    showPasswordReset.hidden = false;
    loginForm.querySelector("#adminEmail").focus();
  });

  resetRequestForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = resetRequestForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      const email = String(new FormData(resetRequestForm).get("email")).trim();
      const redirectTo = new URL("admin.html", window.location.href).href;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      showMessage("Si cette adresse correspond à un compte, un lien de réinitialisation va être envoyé.");
    } catch (error) {
      console.error("Impossible d’envoyer le lien de réinitialisation.", error);
      showMessage("Impossible d’envoyer le lien. Vérifie la configuration Supabase et réessaie.", true);
    } finally {
      submitButton.disabled = false;
    }
  });

  recoveryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = recoveryForm.querySelector('button[type="submit"]');
    const formData = new FormData(recoveryForm);
    const password = String(formData.get("password"));
    const confirmation = String(formData.get("passwordConfirmation"));

    if (password.length < 12) {
      showMessage("Choisis un mot de passe d’au moins 12 caractères.", true);
      return;
    }
    if (password !== confirmation) {
      showMessage("Les deux mots de passe ne correspondent pas.", true);
      return;
    }

    submitButton.disabled = true;
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      isPasswordRecovery = false;
      recoveryForm.reset();
      const { data, error: updatedSessionError } = await supabase.auth.getSession();
      if (updatedSessionError) throw updatedSessionError;
      await showAuthenticatedView(data.session);
      if (!dashboard.hidden) showMessage("Mot de passe mis à jour.");
    } catch (error) {
      console.error("Impossible de mettre à jour le mot de passe.", error);
      showMessage(error.message || "Impossible de mettre à jour le mot de passe. Le lien a peut-être expiré.", true);
    } finally {
      submitButton.disabled = false;
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = loginForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    showMessage("Connexion en cours…");

    try {
     const formData = new FormData(loginForm);
    const { data, error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")).trim(),
    password: String(formData.get("password"))
   });
      if (error) throw error;
      await showAuthenticatedView(data.session);
    } catch (error) {
      console.error("Échec de la connexion à l’administration.", error);
      showMessage("Connexion impossible. Vérifie tes identifiants et la configuration Supabase.", true);
      showMessage(
  signedIn
    ? `Connexion établie, mais le contrôle d’accès ou le chargement des ressources a échoué : ${detail}`
    : `Supabase a refusé la connexion : ${detail}`,
  true
   );
    } finally {
      submitButton.disabled = false;
    }
  });

  resourcesForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = resourcesForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      const updates = [...resourcesForm.querySelectorAll("[data-contact-id]")].map((input) => ({
        id: input.dataset.contactId,
        url: normalizeSupportUrl(input.value, input.dataset.contactId)
      }));
      showMessage("Enregistrement des liens…");
      for (const resource of updates) {
        const { data, error } = await supabase
          .from("site_support_channels")
          .update({ url: resource.url, updated_at: new Date().toISOString() })
          .eq("id", resource.id)
          .select("id")
          .single();

        if (error) throw error;
        if (!data) throw new Error(`Aucun lien mis à jour pour ${resource.id}.`);
      }

      showMessage("Liens de contact enregistrés dans l’espace admin.");
    } catch (error) {
      console.error("Impossible d’enregistrer les liens de contact.", error);
      showMessage(error.message || "Enregistrement impossible. Vérifie les adresses puis réessaie.", true);
    } finally {
      submitButton.disabled = false;
    }
  });

  for (const button of logoutButtons) {
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        hidePanels();
        loginPanel.hidden = false;
        showMessage("Déconnexion effectuée.");
      } catch (error) {
        console.error("Échec de la déconnexion.", error);
        showMessage("La déconnexion n’a pas abouti. Réessaie.", true);
      } finally {
        button.disabled = false;
      }
    });
  }

  await showAuthenticatedView(sessionData.session);
}

try {
  await startAdmin();
} catch (error) {
  console.error("Impossible de démarrer l’administration.", error);
  hidePanels();
  showMessage(error.message || "Impossible de démarrer l’administration.", true);
}
