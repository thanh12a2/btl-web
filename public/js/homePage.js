// Lấy tất cả các carousel-item
const carouselItems = document.querySelectorAll('.carousel-item');

// Dùng sự kiện khi carousel bắt đầu chuyển động
document.querySelector('#carouselExampleAutoplaying').addEventListener('slide.bs.carousel', function (event) {
    const currentItem = event.relatedTarget;
    
    // Lấy các phần tử chứa tiêu đề và ảnh trong item hiện tại
    const title = currentItem.querySelector('.big-news-title');
    const image = currentItem.querySelector('img');

    // Thêm lớp 'hidden-title' để ẩn tiêu đề ngay khi carousel chuyển động
    title.classList.add('hidden-title');
    // Thêm lớp 'hidden-image' để ẩn ảnh ngay khi carousel chuyển động
    image.classList.add('hidden-image');

    // Xóa lớp 'fade-title' nếu có (đảm bảo không bị xung đột)
    title.classList.remove('fade-title');
    // Xóa lớp 'fade-image' nếu có (đảm bảo không bị xung đột)
    image.classList.remove('fade-image');
});

// Khi carousel đã hoàn tất chuyển động, làm text hiện trước ảnh
document.querySelector('#carouselExampleAutoplaying').addEventListener('slid.bs.carousel', function (event) {
    const currentItem = event.relatedTarget;
    const title = currentItem.querySelector('.big-news-title');
    const image = currentItem.querySelector('img');
    
    // Đảm bảo tiêu đề hiển thị trước ảnh
    setTimeout(() => {
        // Thêm lại lớp 'fade-title' để text xuất hiện ngay lập tức
        title.classList.add('fade-title');
    }, 0); // Tiêu đề xuất hiện ngay lập tức

    setTimeout(() => {
        // Thêm lại lớp 'fade-image' để ảnh xuất hiện sau 0.1 giây
        image.classList.add('fade-image');
    }, 100); // Đặt độ trễ 100ms để ảnh xuất hiện sau text
});
