<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="robots" content="noindex, nofollow">
    <title>Recuperar contraseña - INATrace</title>
    <link href="${url.resourcesPath}/css/styles.css" rel="stylesheet" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <div class="container">
        <div class="login-row position-relative">
            <div class="login-left">
                <div class="logo-fixed-container">
                    <img src="${url.resourcesPath}/img/landing-inatrace-logo.png" alt="INA Trace Logo" />
                </div>
                <div class="login-left-inner">
                    <div class="login-title">¿Olvidaste tu contraseña?</div>
                    <div class="login-subtitle">Ingresa tu usuario o correo electrónico y te enviaremos instrucciones sobre cómo crear una nueva contraseña.</div>
                    
                    <#if message?has_content>
                        <div class="form-group error-message">
                            <span>${kcSanitize(message.summary)?no_esc}</span>
                        </div>
                    </#if>

                    <form id="kc-reset-password-form" class="form-group" action="${url.loginAction}" method="post">
                        <label for="username" class="text-input-label">Usuario o correo electrónico</label>
                        <input tabindex="1" id="username" class="text-input-bigger" name="username" value="${(auth.attemptedUsername!'')}" type="text" autofocus autocomplete="off" />

                        <button tabindex="2" class="btn-register" style="margin-top: 30px;" type="submit">Enviar</button>

                        <div style="margin-top: 15px; text-align: center;">
                            <a tabindex="3" href="${url.loginUrl}" class="login-forgot-password" style="font-size: 14px;">« Volver al inicio de sesión</a>
                        </div>
                    </form>
                </div>
            </div>

            <div class="login-right">
                <div class="login-right-side-text">
                    Construimos <br>confianza revelando <br>el camino del cacao <br>ecuatoriano, su <br>historia, su gente
                </div>
            </div>
        </div>
    </div>
</body>
</html>
