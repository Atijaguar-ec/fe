<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="robots" content="noindex, nofollow">
    <title>Bienvenido - INATrace</title>
    <link href="${url.resourcesPath}/css/styles.css" rel="stylesheet" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <div class="container">
        <div class="login-row position-relative">
            <div class="login-left">
                <div class="logo-fixed-container">
                    <!-- Utilizando el logo de ina-trace acorde a la segunda captura -->
                    <img src="${url.resourcesPath}/img/landing-inatrace-logo.png" alt="INA Trace Logo" />
                </div>
                <div class="login-left-inner">
                    <div class="login-title">¡Bienvenido de vuelta!</div>
                    <div class="login-subtitle">Inicia sesión para continuar</div>
                    
                    <#if message?has_content>
                        <div class="form-group error-message">
                            <span>${kcSanitize(message.summary)?no_esc}</span>
                        </div>
                    </#if>

                    <form id="kc-form-login" class="form-group" action="${url.loginAction}" method="post">
                        <label for="username" class="text-input-label">Usuario</label>
                        <input tabindex="1" id="username" class="text-input-bigger" name="username" value="${(login.username!'')}" type="text" autofocus autocomplete="off" />

                        <label for="password" class="text-input-label" style="margin-top: 20px;">Contraseña</label>
                        <input tabindex="2" id="password" class="text-input-bigger" name="password" type="password" autocomplete="off" />

                        <#if realm.resetPasswordAllowed>
                            <div>
                                <a tabindex="5" href="${url.loginResetCredentialsUrl}" class="login-forgot-password">¿Olvidaste tu contraseña?</a>
                            </div>
                        </#if>

                        <button tabindex="4" class="btn-register" type="submit" name="login">Iniciar sesión</button>
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
