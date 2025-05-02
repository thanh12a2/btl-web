document
  .getElementById("oldest-option")
  .addEventListener("click", function (e) {
    e.preventDefault(); // Ngăn chặn hành vi mặc định của thẻ <a>

    // Lấy URL hiện tại
    const currentUrl = new URL(window.location.href);

    // Thêm hoặc cập nhật tham số `option=oldest`
    currentUrl.searchParams.set("option", "oldest");

    // Chuyển hướng đến URL mới
    window.location.href = currentUrl.toString();
  });
