(function () {
  var desktopMinWidth = 901;
  var fixedTop = 80;
  var toc = null;
  var placeholder = null;
  var anchorTop = 0;
  var ticking = false;

  function outerHeight(element) {
    var style = window.getComputedStyle(element);
    return element.offsetHeight + parseFloat(style.marginTop) + parseFloat(style.marginBottom);
  }

  function clearFixed() {
    if (!toc) return;

    toc.classList.remove('toc-fixed-to-side');
    toc.style.width = '';
    toc.style.right = '';
    toc.style.top = '';

    if (placeholder) {
      placeholder.style.display = 'none';
      placeholder.style.height = '';
    }
  }

  function measure() {
    if (!toc || window.innerWidth < desktopMinWidth) {
      clearFixed();
      return;
    }

    var wasFixed = toc.classList.contains('toc-fixed-to-side');
    if (wasFixed) clearFixed();

    var rect = toc.getBoundingClientRect();
    anchorTop = rect.top + window.scrollY;
    toc.dataset.stickyWidth = rect.width;
    toc.dataset.stickyRight = window.innerWidth - rect.right;

    if (wasFixed) update();
  }

  function update() {
    if (!toc || window.innerWidth < desktopMinWidth) {
      clearFixed();
      return;
    }

    if (window.scrollY + fixedTop >= anchorTop) {
      placeholder.style.display = 'block';
      placeholder.style.height = outerHeight(toc) + 'px';

      toc.classList.add('toc-fixed-to-side');
      toc.style.width = toc.dataset.stickyWidth + 'px';
      toc.style.right = toc.dataset.stickyRight + 'px';
      toc.style.top = fixedTop + 'px';
    } else {
      clearFixed();
    }
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      update();
      ticking = false;
    });
  }

  function initTocSticky() {
    toc = document.getElementById('card-toc');
    if (!toc) return;

    var stickyLayout = toc.closest('.sticky_layout');
    if (stickyLayout) stickyLayout.classList.add('toc-sticky-managed');

    if (!placeholder) {
      placeholder = document.createElement('div');
      placeholder.className = 'toc-fixed-placeholder';
      toc.parentNode.insertBefore(placeholder, toc);
    }

    measure();
    update();
  }

  function resetTocSticky() {
    clearFixed();
    toc = null;
    placeholder = null;
    anchorTop = 0;
    ticking = false;
  }

  document.addEventListener('DOMContentLoaded', initTocSticky);
  document.addEventListener('pjax:send', resetTocSticky);
  document.addEventListener('pjax:complete', initTocSticky);
  window.addEventListener('load', measure);
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', function () {
    clearFixed();
    measure();
    update();
  });
})();
