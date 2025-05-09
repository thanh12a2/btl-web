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

var email = "kiet@gmail.com"
var password = "123"
var account_email = [email];
var account_pass = [password];
let drt = document.getElementById("User");

function TaiKhoan(user_name,nrd_name){

    nrd_name.style.marginLeft = "30px";  
    nrd_name.style.marginTop = "20px";   
    nrd_name.style.fontSize = "18px";
    nrd_name.addEventListener("click", function(){
        let ul = nrd_name.querySelector("ul");
        if (ul) {
            // Nếu ul đã có, xóa nó đi (tắt)
            nrd_name.removeChild(ul);
        } else {
            // Nếu chưa có, tạo ul và li mới (hiện)
            let li = document.createElement("li");
            li.innerHTML = "Thoát";
            ul = document.createElement("ul");
            ul.appendChild(li);
            ul.style.listStyle = "none";
            ul.style.position = "absolute";
            ul.style.zIndex = 55;
            ul.style.width = "128px"
            ul.style.textAlign = "right"
            ul.style.height = "25px"
            ul.style.backgroundColor = "white"
            ul.style.boxShadow = "2px 2px 1px black";
            li.addEventListener("click", function() {
                user_name.removeChild(nrd_name);
                user_name.appendChild(drt);
                document.getElementById("Quantri").classList.add("dong");
           });
            nrd_name.appendChild(ul);
        }
    })
    user_name.appendChild(nrd_name);
}

function Login(){
    var login = false;
    for(var i=0;i<account_email.length;i++){
        if(account_email[i] === document.getElementById("email1").value && account_pass[i] === document.getElementById("password1").value){
            if(i==0){
                document.getElementById("Quantri").classList.remove("dong");
            }
            DongDangnhap();
            let user_name = document.getElementById("User_name");
            user_name.removeChild(drt);
            let nrd_name = document.createElement("div");
            nrd_name.textContent += account_email[i];
            TaiKhoan(user_name,nrd_name);
            login = true;
            break;
        }
    }
    if(!login) failLogin();
}

function failLogin(){
    var error = document.createElement("div")
    error.textContent = 'Incorrect email or password. Please try again.'
    error.style.color = "red"
    error.style.display = "block";
    error.style.backgroundColor = "black"
    error.style.zIndex = 999;
    error.style.position = "absolute";
    error.style.width = "500px";
    error.style.height = "100px"
    error.style.lineHeight = "95px";
    error.style.marginLeft = "33%"
    error.style.marginTop = "-420px"
    error.style.textAlign = "center"
    document.getElementById("CongDangnhap").appendChild(error);
    setTimeout(() => {
        document.getElementById("CongDangnhap").removeChild(error);
    },2000)
}

function CreateLogin(){
    var email = document.getElementById("email2").value;
    var passwork = document.getElementById("password2").value;
    var emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if(email === "" || passwork === "" || !emailRegex.test(email)){
        console.log(email+" "+password)
        failLogin();
    }
    else{
        var check = confirm("Bạn có muốn vào đăng nhập")
        account_email.push(email);
        account_pass.push(password);
        console.log(email+" "+password)
        if(check){
            switchToLogin()
        }
        else{
            switchToSignup()
        }
    }
}

document.querySelector(".search-bar-input").addEventListener("keydown", function(event) {
    if (event.key === "Enter" && this.value.trim() !== "") {
        let query = document.getElementsByClassName("search-bar-input")[0].value;
        window.localStorage.setItem("search-value", query);
        window.location.href = "../html/trangTimKiemBaiViet.html";
    }
});

document.querySelector(".search-bar-big-input-menu").addEventListener("keydown", function(event) {
    if (event.key === "Enter" && this.value.trim() !== "") {
        let query = document.getElementsByClassName("search-bar-big-input-menu")[0].value;
        window.localStorage.setItem("search-value", query);
        window.location.href = "../html/trangTimKiemBaiViet.html";
    }
})

document.getElementById("User").addEventListener("click", function() {
    document.getElementById("userPanel").classList.toggle("open-panel")
})



