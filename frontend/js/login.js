/* 登录页独立脚本：登录 / 注册 / 游客进入 */
(function () {
  "use strict";

  // 进入登录页清除旧角色，避免残留
  localStorage.removeItem("lxf_user_role");

  var form, usernameInput, passwordInput, submitBtn, guestBtn, switchLink, errorBox, ball;
  var mode = "login"; // login | register
  var redirecting = false;

  // 等待DOM加载完成后初始化
  function init() {
    form = document.getElementById("loginForm");
    usernameInput = document.getElementById("username");
    passwordInput = document.getElementById("password");
    submitBtn = document.getElementById("submitBtn");
    guestBtn = document.getElementById("guestBtn");
    switchLink = document.getElementById("switchLink");
    errorBox = document.getElementById("loginError");
    ball = document.getElementById("loginBall");

    if (!form || !usernameInput || !passwordInput || !submitBtn || !guestBtn || !switchLink || !errorBox || !ball) {
      console.error("Login page: Some DOM elements not found, retrying...");
      setTimeout(init, 100);
      return;
    }

    bindEvents();
  }

  function bindEvents() {
    setMode("login");

    // 登录 / 注册提交
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearError();

      var username = usernameInput.value.trim();
      var password = passwordInput.value;
      if (!username || !password) {
        showError("请输入用户名和密码");
        return;
      }

      submitBtn.disabled = true;
      var path = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      post(path).then(function (res) {
        if (res.ok) {
          saveRoleFromResponse(res.data);
          enterWorld();
        } else {
          showError((res.data && (res.data.error || res.data.message)) ||
            (mode === "register" ? "注册失败，请重试" : "用户名或密码错误"));
          submitBtn.disabled = false;
        }
      }).catch(function () {
        showError("网络异常，请稍后再试");
        submitBtn.disabled = false;
      });
    });

    // 切换 登录 / 注册 模式
    switchLink.addEventListener("click", function () {
      clearError();
      setMode(mode === "login" ? "register" : "login");
    });

    // 游客进入（不携带表单凭证）
    guestBtn.addEventListener("click", function () {
      clearError();
      guestBtn.disabled = true;
      fetch("/api/auth/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (data) {
          return { ok: r.ok, data: data };
        });
      }).then(function (res) {
        if (res.ok) {
          saveRoleFromResponse(res.data);
          enterWorld();
        } else {
          showError((res.data && (res.data.error || res.data.message)) || "游客进入失败，请重试");
          guestBtn.disabled = false;
        }
      }).catch(function () {
        showError("网络异常，请稍后再试");
        guestBtn.disabled = false;
      });
    });
  }

  function setMode(next) {
    mode = next;
    if (mode === "register") {
      submitBtn.textContent = "注册";
      switchLink.textContent = "已有账号？登录";
    } else {
      submitBtn.textContent = "登录";
      switchLink.textContent = "没有账号？注册";
    }
  }

  function showError(msg) {
    errorBox.textContent = msg;
    usernameInput.classList.add("error");
    passwordInput.classList.add("error");
  }

  function clearError() {
    errorBox.textContent = "";
    usernameInput.classList.remove("error");
    passwordInput.classList.remove("error");
  }

  // 验证成功：中央光球爆发一次光晕，1 秒后进入世界
  function enterWorld() {
    if (redirecting) return;
    redirecting = true;
    ball.classList.add("burst");
    setTimeout(function () {
      window.location.href = "index.html?skipIntro=1";
    }, 1000);
  }

  function saveRoleFromResponse(data) {
    if (data && data.role) {
      localStorage.setItem("lxf_user_role", data.role);
    }
  }

  function post(path) {
    return fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: usernameInput.value.trim(),
        password: passwordInput.value
      })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        return { ok: r.ok, data: data };
      });
    });
  }

  // 启动初始化
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();