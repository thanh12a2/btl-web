// public/js/navbar.js
window.addEventListener("scroll", function(){
    var header = document.querySelector(".navbar-duoi");
    var userPanel = document.getElementById("userPanel");
    var bigMenu = document.getElementById("bigMenu");
    var logo = document.querySelector(".logo-duoi-container img")
    var stats = document.querySelector(".stats-container")

    if (window.scrollY > 80) {
        header.classList.add("sticky");
        bigMenu.style.zIndex = "30"; 
        logo.classList.add("show-class")
        logo.classList.remove("hidden-class")
        stats.classList.add("hidden-class")
        stats.classList.remove("show-class")
    } else {
        header.classList.remove("sticky");
        bigMenu.style.zIndex = "10"; 
        logo.classList.remove("show-class")
        logo.classList.add("hidden-class")
        stats.classList.remove("hidden-class")
        stats.classList.add("show-class")
    }

    if (userPanel && window.scrollY > 5) {
        userPanel.classList.remove("open-panel")
    }
});


document.getElementById("burgerIcon").addEventListener("click", function() {
    document.getElementById("bigMenu").classList.toggle("hidden-overlay")
    document.querySelectorAll(".sub-menu").forEach(el => {
        el.classList.toggle("hidden-overlay");
    });
})

const toggleScrollButton = document.getElementById('burgerIcon');

let isScrollDisabled = false;

let cdn = document.getElementById("CongDangnhap")

function CongDangnhap(){
    cdn.classList.add("mo")
    // Ngăn chặn cuộn trang
    document.body.classList.add('no-scroll');
}

function DongDangnhap(){
    cdn.classList.remove("mo")
    // Cho phép cuộn trang
    document.body.classList.remove('no-scroll');
}

function switchToSignup() {
    // Ẩn form đăng nhập
    document.getElementById('Dangnhap').classList.remove('active');
    // Hiển thị form đăng ký
    document.getElementById('Dangky').classList.add('active');
}

function switchToLogin() {
    // Ẩn form đăng ký
    document.getElementById('Dangky').classList.remove('active');
    // Hiển thị form đăng nhập
    document.getElementById('Dangnhap').classList.add('active');
}

document.getElementById("User").addEventListener("click", function() {
    document.getElementById("userPanel").classList.toggle("open-panel")
})

document.getElementById("forgetPwdBtn").addEventListener("click", function() {
    document.getElementById("loginForm").classList.display = "none";
    document.getElementById("forgotPwd").classList.display = "block";
})

function toggleForgotPwd() {
    const loginForm = document.getElementById("loginForm"); // Form đăng nhập
    const forgotPwdForm = document.getElementById("forgotPwd"); // Form quên mật khẩu

    // Ẩn form đăng nhập và hiển thị form quên mật khẩu
    if (forgotPwdForm.style.display === "block") {
        forgotPwdForm.style.display = "none";
        loginForm.style.display = "block";
    } else {
        forgotPwdForm.style.display = "block";
        loginForm.style.display = "none";
    }
}

document.getElementById("emailForgot").addEventListener("input", function () {
    const emailInput = this.value.trim();
    const sendOtpBtn = document.getElementById("sendOtpBtn");

    // Kiểm tra nếu email không rỗng
    if (emailInput !== "") {
        sendOtpBtn.removeAttribute("disabled");
    } else {
        sendOtpBtn.setAttribute("disabled", "true");
    }
});


// function checkInputs() {
//     if (userEmailInp.value.trim() !== "" && userPwdInp.value.trim() !== "") {
//         submitBtn.removeAttribute("disabled");
//     } else {
//         submitBtn.setAttribute("disabled", "true");
//     }

//     if (userNameInp1.value.trim() !== "" && userEmailInp1.value.trim() !== "" && userPwdInp1.value.trim() !== "") {
//         registerBtn.removeAttribute("disabled");
//     }
//     else {
//         registerBtn.setAttribute("disabled", "true");
//     }
// }
