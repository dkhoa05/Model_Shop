/**
 * Bổ sung tên truy cập (aria-label) cho các điều khiển/biểu đồ của trang admin cũ chưa có nhãn,
 * suy ra từ title, placeholder, chữ nhãn đứng ngay trước hoặc tên trường. Đây là lớp đệm cho giao diện cũ;
 * biểu mẫu mới nên dùng <label htmlFor> tường minh.
 */
const SELECTOR = "input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea, canvas[role=img]";

function hasName(el) {
  if (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby")) return true;
  if (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) return true;
  const wrapping = el.closest("label");
  if (wrapping && wrapping.textContent.replace(el.textContent || "", "").trim()) return true;
  return false;
}

function textOf(node) {
  return (node?.textContent || "").replace(/\s+/g, " ").trim();
}

function guessName(el) {
  if (el.tagName === "CANVAS") {
    const section = el.closest("section, article, div");
    const heading = section?.querySelector("h1,h2,h3,p");
    return textOf(heading) ? `Biểu đồ: ${textOf(heading).slice(0, 60)}` : "Biểu đồ";
  }
  const title = el.getAttribute("title");
  if (title) return title;
  const placeholder = el.getAttribute("placeholder");
  if (placeholder) return placeholder;
  // chữ nhãn đứng ngay trước (span/p/label/div ngắn)
  let prev = el.previousElementSibling;
  while (prev && !textOf(prev)) prev = prev.previousElementSibling;
  if (prev && textOf(prev).length <= 60) return textOf(prev);
  const parentLabel = el.parentElement?.querySelector(":scope > span, :scope > p, :scope > label");
  if (parentLabel && textOf(parentLabel).length <= 60) return textOf(parentLabel);
  const name = el.getAttribute("name");
  if (name) return name;
  if (el.tagName === "SELECT") {
    const first = [...el.options].find((o) => o.textContent.trim());
    if (first) return `Chọn: ${first.textContent.trim()}`;
  }
  if (el.type === "file") return "Chọn tệp";
  if (el.type === "date") return "Ngày";
  return "Trường nhập liệu";
}

export function labelControls(root) {
  if (!root) return;
  root.querySelectorAll(SELECTOR).forEach((el) => {
    if (!hasName(el)) el.setAttribute("aria-label", guessName(el));
  });
  // Cột tiêu đề bảng rỗng (cột thao tác) cần tên cho trình đọc màn hình
  root.querySelectorAll("th").forEach((th) => {
    if (!th.textContent.trim() && th.children.length === 0) {
      const hidden = document.createElement("span");
      hidden.className = "sr-only";
      hidden.textContent = "Thao tác";
      th.appendChild(hidden);
    }
  });
}

/** Theo dõi thay đổi DOM (trang tải dữ liệu bất đồng bộ) và gắn nhãn khi cần */
export function watchAndLabel(root) {
  if (!root) return () => undefined;
  let timer = 0;
  const run = () => {
    clearTimeout(timer);
    timer = setTimeout(() => labelControls(root), 30);
  };
  run();
  const observer = new MutationObserver(run);
  observer.observe(root, { childList: true, subtree: true });
  return () => {
    observer.disconnect();
    clearTimeout(timer);
  };
}
