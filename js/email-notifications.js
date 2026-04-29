(function () {
  function clean(value, max = 1000) {
    return String(value || "").replace(/[<>]/g, "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
  }

  function configured(config) {
    return Boolean(config?.enabled && config.serviceId && config.templateId && config.publicKey && !String(config.serviceId).includes("PASTE_"));
  }

  async function notifyPendingUser(profile) {
    const config = window.EMAIL_NOTIFICATION_CONFIG || {};
    if (!configured(config)) return { sent: false, reason: "EmailJS is not configured" };
    const adminUrl = config.adminUrl || new URL("admin.html", location.origin + "/").href;
    const payload = {
      service_id: clean(config.serviceId, 180),
      template_id: clean(config.templateId, 180),
      user_id: clean(config.publicKey, 240),
      template_params: {
        to_email: clean(config.adminEmail || "osherper@gmail.com", 320),
        subject: "משתמש חדש ממתין לאישור באתר ממונה בטיחות",
        user_email: clean(profile?.email, 320),
        user_name: clean(profile?.displayName || profile?.email, 180),
        user_uid: clean(profile?.uid, 180),
        admin_link: adminUrl,
        approve_link: adminUrl + "?uid=" + encodeURIComponent(clean(profile?.uid, 180)) + "&action=approve",
        message: "משתמש חדש נרשם וממתין לאישור מנהל האתר."
      }
    };
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return { sent: response.ok, status: response.status };
  }

  window.CourseEmailNotifications = { notifyPendingUser };
})();
