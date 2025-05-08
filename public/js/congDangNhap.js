document.addEventListener('DOMContentLoaded', function() {
    const loginBtn = document.getElementById('loginBtn');
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    
    // Khởi tạo popovers và lưu vào một Map để quản lý
    const popovers = new Map();
    popoverTriggerList.forEach(function (element) {
        // Chỉ khởi tạo popover cho các button disabled
        const relatedButton = element.querySelector('button');
        if (relatedButton && relatedButton.disabled) {
            const popover = new bootstrap.Popover(element);
            popovers.set(element, popover);
        }
    });

    // Theo dõi sự thay đổi của các button
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === "disabled") {
                const button = mutation.target;
                const popoverElement = button.closest('[data-bs-toggle="popover"]');
                
                if (!button.disabled) {
                    // Nếu button được enable, hủy popover
                    const popover = popovers.get(popoverElement);
                    if (popover) {
                        popover.dispose();
                        popovers.delete(popoverElement);
                    }
                } else {
                    // Nếu button bị disable, tạo lại popover
                    if (!popovers.has(popoverElement)) {
                        const popover = new bootstrap.Popover(popoverElement);
                        popovers.set(popoverElement, popover);
                    }
                }
            }
        });
    });

    // Theo dõi tất cả các button
    document.querySelectorAll('button').forEach(button => {
        observer.observe(button, {
            attributes: true
        });
    });
});

document.getElementById('txt_dn').addEventListener('click', function() {
    document.getElementById('txt_dn').classList.add("clicked-effect");
    document.getElementById('txt_dk').classList.remove("clicked-effect");
});

document.getElementById('txt_dk').addEventListener('click', function() {
    document.getElementById('txt_dn').classList.remove("clicked-effect");
    document.getElementById('txt_dk').classList.add("clicked-effect");
}); 

const userEmailInp = document.getElementById("email1");
const userPwdInp = document.getElementById("password1");
const submitBtn = document.getElementById("loginBtn");

const userNameInp1 = document.getElementById("username5");
const userEmailInp1 = document.getElementById("email5");
const userPwdInp1 = document.getElementById("password5");
const registerBtn = document.getElementById("registerBtn");

const emailForgotInp = document.getElementById("emailForgot");
const emailForgotBtn = document.getElementById("sendOtpBtn")

function checkInputs() {
    if (userEmailInp.value.trim() !== "" && userPwdInp.value.trim() !== "") {
        submitBtn.removeAttribute("disabled");
    } else {
        submitBtn.setAttribute("disabled", "true");
    }

    if (userNameInp1.value.trim() !== "" && userEmailInp1.value.trim() !== "" && userPwdInp1.value.trim() !== "") {
        registerBtn.removeAttribute("disabled");
    }
    else {
        registerBtn.setAttribute("disabled", "true");
    }

    if (emailForgotInp.value.trim() !== "") {
        emailForgotBtn.removeAttribute("disabled");
    }
    else {
        emailForgotBtn.setAttribute("disabled", "true");
    }
}

[userEmailInp, userPwdInp, userNameInp1, userEmailInp1, userPwdInp1, emailForgotInp].forEach(input => {
    input.addEventListener("input", checkInputs);
});

document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault(); 

    try {
        // Lấy dữ liệu từ form và chuyển thành object
        const formData = new FormData(this);
        const formDataObject = {};
        formData.forEach((value, key) => {
            formDataObject[key] = value;
        });
        
        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'  // Thêm header
            },
            body: JSON.stringify(formDataObject)  // Chuyển đổi thành JSON
        });

        if (!response.ok) {
            Swal.fire({
                title: 'Email đã tồn tại!',
                text: 'Vui lòng sử dụng email khác.',
                icon: 'error', // Thay đổi icon thành 'error' để phù hợp với thông báo lỗi
                confirmButtonText: 'Tiếp tục',
                timer: 1200,
                timerProgressBar: true,
                customClass: {
                    popup: 'custom-popup',
                    title: 'custom-title-red',
                    content: 'custom-content-red', // Lớp tùy chỉnh cho nội dung
                    confirmButton: 'custom-confirm-button'
                }
            }).then((result) => {
                if (result.dismiss === Swal.DismissReason.timer) {
                    console.log('Thông báo đã tự động đóng sau 1 giây');
                }
            });
        }

        const data = await response.json();
        console.log('Response:', data); // Log để debug

        if (data.success) {
            Swal.fire({
                title: 'Đăng ký thành công!',
                text: 'Chào mừng bạn đến với chúng tôi!',
                icon: 'success',
                confirmButtonText: 'Tiếp tục',
                timer: 1200,
                timerProgressBar: true,
                customClass: {
                    popup: 'custom-popup',
                    title: 'custom-title',
                    content: 'custom-content',
                    confirmButton: 'custom-confirm-button'
                }
            }).then((result) => {
                if (result.dismiss === Swal.DismissReason.timer) {
                    console.log('Thông báo đã tự động đóng sau 1 giây');
                }
            });
            this.reset();
            document.getElementById('txt_dn')?.click();
            registerBtn.setAttribute("disabled", "true");
        } else {
            // alert(data.message || 'Có lỗi xảy ra');
            Swal.fire({
                title: 'Có lỗi xảy ra!',
                text: 'Vui lòng kiểm tra thông tin và thử lại.',
                icon: 'error',
                confirmButtonText: 'Tiếp tục',
                timer: 1200,
                timerProgressBar: true,
                customClass: {
                    popup: 'custom-popup',
                    title: 'custom-title-red',
                    content: 'custom-content', // Lớp tùy chỉnh cho nội dung
                    confirmButton: 'custom-confirm-button'
                }
            }).then((result) => {
                if (result.dismiss === Swal.DismissReason.timer) {
                    console.log('Thông báo đã tự động đóng sau 1 giây');
                }
            });
        }
    } catch (error) {
        console.error('Lỗi chi tiết:', error); // Log lỗi chi tiết
        alert('Lỗi: ' + error.message);
    }
});

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault(); 

    try {
        // Lấy dữ liệu từ form và chuyển thành object
        const formData = new FormData(this);
        const formDataObject = {};
        formData.forEach((value, key) => {
            formDataObject[key] = value;
        });
        
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'  // Thêm header
            },
            body: JSON.stringify(formDataObject)  // Chuyển đổi thành JSON
        });

        // Kiểm tra phản hồi
        if (!response.ok) {
            Swal.fire({
                title: 'Đăng nhập thất bại!',
                text: 'Tên đăng nhập hoặc mật khẩu không đúng.',
                icon: 'error',
                confirmButtonText: 'Tiếp tục',
                timer: 1200,
                timerProgressBar: true,
                customClass: {
                    popup: 'custom-popup',
                    title: 'custom-title-red',
                    content: 'custom-content-red', // Lớp tùy chỉnh cho nội dung
                    confirmButton: 'custom-confirm-button'
                }
            }).then((result) => {
                if (result.dismiss === Swal.DismissReason.timer) {
                    console.log('Thông báo đã tự động đóng sau 1 giây');
                }
            });
            return; // Dừng hàm nếu có lỗi
        }

        const data = await response.json();
        console.log('Response:', data); // Log để debug

        if (data.success) {
            window.location.href = window.location.href;
        } else {
            Swal.fire({
                title: 'Có lỗi xảy ra!',
                text: 'Vui lòng kiểm tra thông tin và thử lại.',
                icon: 'error',
                confirmButtonText: 'Tiếp tục',
                timer: 1200,
                timerProgressBar: true,
                customClass: {
                    popup: 'custom-popup',
                    title: 'custom-title-red',
                    content: 'custom-content', // Lớp tùy chỉnh cho nội dung
                    confirmButton: 'custom-confirm-button'
                }
            }).then((result) => {
                if (result.dismiss === Swal.DismissReason.timer) {
                    console.log('Thông báo đã tự động đóng sau 1 giây');
                }
            });
        }
    } catch (error) {
        console.error('Lỗi chi tiết:', error); // Log lỗi chi tiết
        alert('Lỗi: ' + error.message);
    }
});

document.getElementById('logoutBtn').addEventListener('click', async function(e) {
    e.preventDefault(); 

    try {
        const response = await fetch('/auth/logout', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'  // Thêm header
            }
        });

        const data = await response.json();
        console.log('Response:', data); // Log để debug

        if (data.success) {
            await Swal.fire({
                title: 'Bạn đã đăng xuất!',
                text: 'Tạm biệt. Hẹn gặp bạn sớm!',
                icon: 'success',
                confirmButtonText: 'Tiếp tục',
                timer: 1200,
                timerProgressBar: true,
                customClass: {
                    popup: 'custom-popup',
                    title: 'custom-title',
                    content: 'custom-content',
                    confirmButton: 'custom-confirm-button'
                }
            }).then((result) => {
                if (result.dismiss === Swal.DismissReason.timer) {
                    console.log('Thông báo đã tự động đóng sau 1 giây');
                }
            });
            setTimeout(() => {
                window.location.href = window.location.href;
            }, 500); // 500 milliseconds = 0.5 seconds
        } else {
            Swal.fire({
                title: 'Có lỗi xảy ra!',
                text: 'Vui lòng kiểm tra thông tin và thử lại.',
                icon: 'error',
                confirmButtonText: 'Tiếp tục',
                timer: 1200,
                timerProgressBar: true,
                customClass: {
                    popup: 'custom-popup',
                    title: 'custom-title-red',
                    content: 'custom-content', // Lớp tùy chỉnh cho nội dung
                    confirmButton: 'custom-confirm-button'
                }
            }).then((result) => {
                if (result.dismiss === Swal.DismissReason.timer) {
                    console.log('Thông báo đã tự động đóng sau 1 giây');
                }
            });
        }
    } catch (error) {
        console.error('Lỗi chi tiết:', error); // Log lỗi chi tiết
        alert('Lỗi: ' + error.message);
    }
});


function showLoginForm() {
    // Hiển thị form đăng nhập
    document.getElementById('CongDangnhap').style.display = 'block'; // Hoặc cách khác để hiển thị form

    // Ngăn chặn cuộn trang
    document.body.classList.add('no-scroll');
}

function hideLoginForm() {
    // Ẩn form đăng nhập
    document.getElementById('CongDangnhap').style.display = 'none'; // Hoặc cách khác để ẩn form

    // Cho phép cuộn trang
    document.body.classList.remove('no-scroll');
}

