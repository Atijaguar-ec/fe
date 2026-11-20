<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="robots" content="noindex, nofollow">
    <title>Actualizar contraseña - INATrace</title>
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
                    <div class="login-title">Actualizar contraseña</div>
                    <div class="login-subtitle">Por favor ingresa tu nueva contraseña.</div>
                    
                    <#if message?has_content>
                        <div class="form-group error-message">
                            <span>${kcSanitize(message.summary)?no_esc}</span>
                        </div>
                    </#if>

                    <form id="kc-passwd-update-form" class="form-group" action="${url.loginAction}" method="post">
                        <label for="password-new" class="text-input-label">Nueva contraseña</label>
                        <input tabindex="1" id="password-new" class="text-input-bigger" name="password-new" type="password" autofocus autocomplete="new-password" />

                        <label for="password-confirm" class="text-input-label" style="margin-top: 20px;">Confirmar contraseña</label>
                        <input tabindex="2" id="password-confirm" class="text-input-bigger" name="password-confirm" type="password" autocomplete="new-password" />

                        <button tabindex="3" class="btn-register" style="margin-top: 30px;" type="submit">Enviar</button>
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
