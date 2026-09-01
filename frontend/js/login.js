/* 登录页独立脚本：登录 / 注册 / 游客进入 */
(function () {
  "use strict";

  var form = document.getElementById("loginForm");
  var usernameInput = document.getElementById("username");
  var passwordInput = document.getElementById("password");
  var submitBtn = document.getElementById("submitBtn");
  var guestBtn = document.getElementById("guestBtn");
  var switchLink = document.getElementById("switchLink");
  var errorBox = document.getElementById("loginError");
  var ball = document.getElementById("loginBall");

  var mode = "login"; // login | register
  var redirecting = false;

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
})();
