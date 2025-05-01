// "use strict";

// const bigCate = document.querySelectorAll(".sub-menu-big a li")

// Truy xuất các phần tử DOM
const userComment = document.querySelector(".user-comment")
const publishBtn = document.querySelector("#publish-button")
const comments = document.querySelector(".comments")
const userName = document.querySelector(".user-name")
const userAvatar = document.querySelector(".user-avatar").src;
const scrollBtn = document.querySelector(".go-back-button")
const xemThemButton = document.querySelector(".xem-them")

// Lắng nghe sự kiện nhập nội dung bình luận
userComment.addEventListener("input", e => {
    if (!userComment.value) {
        publishBtn.setAttribute("disabled", "disabled"); // Vô hiệu hóa nút nếu không có nội dung
        publishBtn.classList.remove("abled");
    } else {
        publishBtn.removeAttribute("disabled"); // Kích hoạt nút khi có nội dung
        publishBtn.classList.add("abled");
    }
});

// let totalHeight = 0; // Biến lưu tổng chiều cao của các bình luận

// // Hàm thêm bài đăng bình luận
// function addPost() {
//     console.log("The button works")
//     if (!userComment.value) return;

//     // Cập nhật thông tin người dùng
//     userId.name = userName.innerHTML;
//     userId.identity = true;
//     userId.image = userAvatar;
//     userId.message = userComment.value;
//     userId.date = new Date().toLocaleString();

//     let published = "";
//     if (totalHeight <= 800 ) {
//         // Nếu tổng chiều cao bình luận chưa vượt quá 800px, hiển thị bình luận ngay
//         published = 
//         `<div class="parents">
//             <div class="info-commented-container">
//                 <img src="${userId.image}">
//                 <div class="user-commented">
//                     <div class="user-commented-info">
//                         <h3>${userId.name}<h3>
//                         <span class="date">${userId.date}</span>
//                     </div>
//                     <p>${userId.message}</p>
//                 </div>
//             </div> 

//             <div class="engagements">
//                 <div class="engagement-likes">
//                     <span class="likes-numbers">0</span>
//                     <i class="bi bi-hand-thumbs-up"></i>
//                 </div>
//                 <div class="engagement-replies">
//                     <button id="btnReply" type="button" class="btn btn-link">Trả lời</button>
//                 </div>
//             </div>

//             <div class="reply-box hidden">
//                 <div class="comment-section-user comment-reply">
//                     <div class="user-info">
//                         <img src="../assets/vectors/avatarComment.png" alt="" class="user-avatar">
//                         <h3 class="user-name">Nguyễn Quang Trung</h3>
//                     </div>

//                     <div class="comment-input">
//                         <input type="text" placeholder="Hãy để lại bình luận của bạn." class="user-comment">
//                         <div class="comment-input-button">
//                             <button type="submit" disabled class="btn btn-outline-primary publish-reply">Đăng tải</button>
//                         </div>
//                     </div>  
//                 </div>
//             </div>
//         </div>`
//     }
//     else {
//         // Nếu vượt quá 800px, ẩn bình luận và hiển thị nút "Xem thêm"
//         published = 
        // `<div class="parents hidden">
        //     <div class="info-commented-container">
        //         <img src="${userId.image}">
        //         <div class="user-commented">
        //             <div class="user-commented-info">
        //                 <h3>${userId.name}<h3>
        //                 <span class="date">${userId.date}</span>
        //             </div>
        //             <p>${userId.message}</p>
        //         </div>
        //     </div> 

        //     <div class="engagements">
        //         <div class="engagement-likes">
        //             <span class="likes-numbers">0</span>
        //             <i class="bi bi-hand-thumbs-up"></i>
        //         </div>
        //         <div class="engagement-replies">
        //             <button id="btnReply" type="button" class="btn btn-link">Trả lời</button>
        //         </div>
        //     </div>

        //     <div class="reply-box hidden">
        //         <div class="comment-section-user comment-reply">
        //             <div class="user-info">
        //                 <img src="../assets/vectors/avatarComment.png" alt="" class="user-avatar">
        //                 <h3 class="user-name">Nguyễn Quang Trung</h3>
        //             </div>

        //             <div class="comment-input">
        //                 <input type="text" placeholder="Hãy để lại bình luận của bạn." class="user-comment">
        //                 <div class="comment-input-button">
        //                     <button type="submit" disabled class="btn btn-outline-primary publish-reply">Đăng tải</button>
        //                 </div>
        //             </div>  
        //         </div>
        //     </div>

        // </div>`

//         xemThemButton.classList.remove("hidden");
//     }
    
//     // Thêm bình luận vào danh sách
//     comments.innerHTML += published;
//     userComment.value = ""; // Xóa nội dung ô nhập sau khi đăng

//     // Cập nhật số lượng bình luận
//     let commentNums = document.querySelectorAll(".parents").length;
//     document.querySelector(".comment-num").textContent = commentNums;
   
//     // Cập nhật tổng chiều cao của bình luận
//     document.querySelectorAll('.parents').forEach(el => {
//         totalHeight += el.offsetHeight;
//     });
//     console.log("Tổng chiều cao:", totalHeight);

    // Gán sự kiện cho tất cả các nút "Trả lời" sau khi thêm comment
    document.querySelectorAll(".engagement-replies #btnReply").forEach(button => {
        button.addEventListener("click", (e) => {
            let replyBox = e.target.closest(".parents").querySelector(".reply-box");
            replyBox.classList.toggle("hidden");
         });
    });

    document.querySelectorAll(".reply-box .user-comment").forEach(input => {
        input.addEventListener("input", (e) => {
            let replyBtn = e.target.closest(".reply-box").querySelector(".publish-reply");
            if (e.target.value.trim()) {
                replyBtn.removeAttribute("disabled");
                replyBtn.classList.add("abled");
            } else {
                replyBtn.setAttribute("disabled", "disabled");
                replyBtn.classList.remove("abled");
            }
        });
    });

//     document.querySelectorAll(".publish-reply").forEach(button => {
//         button.addEventListener("click", (e) => {
//             let replyBox = e.target.closest(".reply-box");
//             let replyInput = replyBox.querySelector(".user-comment");
//             let replyMessage = replyInput.value.trim();
    
//             if (!replyMessage) return; // Không cho phép đăng nếu không có nội dung
    
//             let parentComment = e.target.closest(".parents");
//             let replyHTML = `
                // <div class="reply">
                //     <div class="info-commented-container">
                //         <img src="../assets/vectors/avatarComment.png">
                //         <div class="user-commented">
                //             <div class="user-commented-info">
                //                 <h3>Nguyễn Quang Trung</h3>
                //                 <span class="date">${new Date().toLocaleString()}</span>
                //             </div>
                //             <p>${replyMessage}</p>
                //         </div>
                //     </div>
                // </div>
//             `;
    
//             // Thêm reply vào dưới comment cha
//             parentComment.insertAdjacentHTML("beforeend", replyHTML);
    
//             // Xóa nội dung input và ẩn reply box
//             replyInput.value = "";
//             replyBox.classList.add("hidden");
    
//             // Reset lại trạng thái nút đăng tải
//             button.setAttribute("disabled", "disabled");
//             button.classList.remove("abled");
//         });
//     });
    
// }

// // Lắng nghe sự kiện click để đăng bình luận
// publishBtn.addEventListener("click", addPost)


// Lắng nghe sự kiện click để cuộn lên đầu trang
scrollBtn.addEventListener("click", () => {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
});

// // Xử lý sự kiện khi nhấn nút "Xem thêm"
// xemThemButton.addEventListener("click", () => {
//     if ( xemThemButton.textContent == "Xem thêm") {
//         document.querySelectorAll(".parents.hidden").forEach(el => {
//             el.classList.remove("hidden");
//         });
//         xemThemButton.classList.add("hidden");
//     }
// });



