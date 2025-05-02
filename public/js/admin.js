let btn = document.querySelector("#btn");

let sidebar = document.querySelector(".sidebar");



btn.onclick = function() {

    console.time("Toggle Sidebar");

    sidebar.classList.toggle("active");



        console.timeEnd("Toggle Sidebar");

}


document.addEventListener("DOMContentLoaded", function () {
    let menuItems = document.querySelectorAll(".nav_list li a");
    let sections = {
        "Thông tin cá nhân": document.getElementById("infoManagement"),
        "Thông tin nhà báo": document.getElementById("info-nhabao-Management"),
        "Danh sách bài viết": document.getElementById("statistic-nhabao-Management"),
        "Thêm bài báo" : document.getElementById("addPostManagement"),
        "Thống kê dữ liệu": document.getElementById("staticManagement"),
        "Quản lý bài viết": document.getElementById("postManagement"),
        "Quản lý danh mục": document.getElementById("categoryManagement"),
        "Quản lý người dùng": document.getElementById("userManagement"),
        "Quản lý bình luận": document.getElementById("commentManagement"),
    };


    menuItems.forEach(item => {
        item.addEventListener("click", function (e) {
            e.preventDefault();


            // Lấy tên menu vừa click
            let menuName = this.querySelector(".links_name").innerText;


            // Ẩn tất cả các phần nội dung
            Object.values(sections).forEach(section => section.style.display = "none");


            // Hiển thị nội dung của menu vừa nhấn
            sections[menuName].style.display = "block";


            // Xóa 'active' khỏi tất cả menu
            menuItems.forEach(link => link.parentElement.classList.remove("active"));


            // Đánh dấu menu được chọn là 'active'
            this.parentElement.classList.add("active");

        });
    });

    // TAB info_management (bao gồm cả các mục thống kê nhà báo)
    const allTabs = document.querySelectorAll('.info_management-tab');
    const allTabContents = document.querySelectorAll('.info_management-tab-content');
    allTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Lấy group tab cha gần nhất
            const parent = this.closest('.info_management-side');
            const tabs = parent.querySelectorAll('.info_management-tab');
            const tabContents = parent.querySelectorAll('.info_management-tab-content');
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            tabContents.forEach(content => content.style.display = 'none');
            const tabId = this.dataset.tab;
            if(tabId) parent.querySelector(`#${tabId}`).style.display = 'block';
        });
    });

    // CRUD mẫu cho Bài viết yêu thích
    let favoriteArticles = [
        {id: 1, title: 'Bài viết A', author: 'Tác giả 1', date: '2024-06-01'},
        {id: 2, title: 'Bài viết B', author: 'Tác giả 2', date: '2024-06-02'}
    ];
    function renderFavoriteArticles() {
        const tbody = document.getElementById('favoriteArticlesBody');
        tbody.innerHTML = favoriteArticles.map(a => `
            <tr>
                <td>${a.id}</td>
                <td>${a.title}</td>
                <td>${a.author}</td>
                <td>${a.date}</td>
                <td>
                    <button class=\"info_management-action-btn\" onclick=\"deleteFavoriteArticle(${a.id})\">Xóa</button>
                </td>
            </tr>
        `).join('');
    }
    window.deleteFavoriteArticle = function(id) {
        favoriteArticles = favoriteArticles.filter(a => a.id !== id);
        renderFavoriteArticles();
    }
    renderFavoriteArticles();

    // CRUD mẫu cho Bình luận của tôi
    let myComments = [
        {id: 1, post: 'Bài viết A', content: 'Bình luận 1', date: '2024-06-01'},
        {id: 2, post: 'Bài viết B', content: 'Bình luận 2', date: '2024-06-02'}
    ];
    function renderMyComments() {
        const tbody = document.getElementById('myCommentsBody');
        tbody.innerHTML = myComments.map(c => `
            <tr>
                <td>${c.id}</td>
                <td>${c.post}</td>
                <td>${c.content}</td>
                <td>${c.date}</td>
                <td>
                    <button class=\"info_management-action-btn\" onclick=\"deleteMyComment(${c.id})\">Xóa</button>
                </td>
            </tr>
        `).join('');
    }
    window.deleteMyComment = function(id) {
        myComments = myComments.filter(c => c.id !== id);
        renderMyComments();
    }
    renderMyComments();

    // CRUD mẫu cho Bình luận yêu thích
    let favoriteComments = [
        {id: 1, post: 'Bài viết A', content: 'Bình luận hay', date: '2024-06-01'},
        {id: 2, post: 'Bài viết B', content: 'Bình luận xuất sắc', date: '2024-06-02'}
    ];
    function renderFavoriteComments() {
        const tbody = document.getElementById('favoriteCommentsBody');
        tbody.innerHTML = favoriteComments.map(c => `
            <tr>
                <td>${c.id}</td>
                <td>${c.post}</td>
                <td>${c.content}</td>
                <td>${c.date}</td>
                <td>
                    <button class=\"info_management-action-btn\" onclick=\"deleteFavoriteComment(${c.id})\">Xóa</button>
                </td>
            </tr>
        `).join('');
    }
    window.deleteFavoriteComment = function(id) {
        favoriteComments = favoriteComments.filter(c => c.id !== id);
        renderFavoriteComments();
    }
    renderFavoriteComments();

    // Dữ liệu mẫu cho Thống kê bài viết của tôi
    let statisticMyArticles = [
        {id: 1, title: 'Bài viết A', views: 120, likes: 10, date: '2024-06-01', status: 'Đã duyệt'},
        {id: 2, title: 'Bài viết B', views: 80, likes: 5, date: '2024-06-02', status: 'Chờ duyệt'}
    ];
    function renderStatisticMyArticles() {
        const tbody = document.getElementById('statisticMyArticlesBody');
        if (!tbody) return;
        tbody.innerHTML = statisticMyArticles.map(a => `
            <tr>
                <td>${a.id}</td>
                <td>${a.title}</td>
                <td>${a.views}</td>
                <td>${a.likes}</td>
                <td>${a.date}</td>
                <td>${a.status}</td>
            </tr>
        `).join('');
    }
    renderStatisticMyArticles();

    // Dữ liệu mẫu cho Thông báo bài viết được duyệt
    let statisticApproveNotify = [
        'Bài viết "Bài viết A" đã được duyệt ngày 2024-06-01',
        'Bài viết "Bài viết B" đã được duyệt ngày 2024-06-02'
    ];
    function renderStatisticApproveNotify() {
        const ul = document.getElementById('statisticApproveNotifyList');
        if (!ul) return;
        ul.innerHTML = statisticApproveNotify.map(n => `<li>${n}</li>`).join('');
    }
    renderStatisticApproveNotify();

    // Dữ liệu mẫu cho Thống kê tổng quan của nhà báo
    let statisticOverview = {
        totalArticles: 12,
        totalViews: 3456,
        totalLikes: 234,
        totalComments: 78
    };
    function renderStatisticOverview() {
        if(document.getElementById('statisticTotalArticles'))
            document.getElementById('statisticTotalArticles').innerText = statisticOverview.totalArticles;
        if(document.getElementById('statisticTotalViews'))
            document.getElementById('statisticTotalViews').innerText = statisticOverview.totalViews;
        if(document.getElementById('statisticTotalLikes'))
            document.getElementById('statisticTotalLikes').innerText = statisticOverview.totalLikes;
        if(document.getElementById('statisticTotalComments'))
            document.getElementById('statisticTotalComments').innerText = statisticOverview.totalComments;
    }
    renderStatisticOverview();
});








