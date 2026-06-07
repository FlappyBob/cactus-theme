/**
 * Sets up Justified Gallery.
 */
if (!!$.prototype.justifiedGallery) {
  var options = {
    rowHeight: 140,
    margins: 4,
    lastRow: "justify"
  };
  $(".article-gallery").justifiedGallery(options);
}

$(document).ready(function() {

  /**
   * Apple-like page transitions for normal link navigation.
   */
  (function() {
    var transitionKey = "applePageTransition";
    var filePattern = /\.(?:avif|bmp|gif|jpe?g|png|svg|webp|ico|pdf|zip|rar|7z|tar|gz|mp3|mp4|mov|webm|docx?|pptx?|xlsx?)$/i;

    function prefersReducedMotion() {
      return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    function ensureVeil() {
      var veil = document.querySelector(".page-transition-veiling");
      if (!veil) {
        veil = document.createElement("div");
        veil.className = "page-transition-veiling";
        veil.setAttribute("aria-hidden", "true");
        document.body.appendChild(veil);
      }
      return veil;
    }

    function isSameDocumentHash(url) {
      return url.origin === window.location.origin &&
        url.pathname === window.location.pathname &&
        url.search === window.location.search &&
        url.hash &&
        url.hash !== window.location.hash;
    }

    function shouldTransition(link, event) {
      var rawHref = link.getAttribute("href");
      if (!rawHref || rawHref.charAt(0) === "#" || link.hasAttribute("download") || link.dataset.noTransition === "true") {
        return false;
      }

      var url = new URL(link.href, window.location.href);
      var isPlainClick = !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0;
      var protocol = url.protocol.toLowerCase();

      if (!isPlainClick || link.target || prefersReducedMotion()) return false;
      if (protocol !== "http:" && protocol !== "https:") return false;
      if (isSameDocumentHash(url)) return false;
      if (filePattern.test(url.pathname)) return false;

      return true;
    }

    if (sessionStorage.getItem(transitionKey) === "1") {
      sessionStorage.removeItem(transitionKey);
      if (!prefersReducedMotion()) {
        document.body.classList.add("apple-transition-in");
      }
    }

    // When browser restores page from bfcache (back/forward), strip any
    // leftover transition state so the page renders immediately.
    window.addEventListener("pageshow", function(e) {
      if (e.persisted) {
        document.body.classList.remove("apple-transition-out", "apple-transition-in");
        var veil = document.querySelector(".page-transition-veiling");
        if (veil) veil.remove();
        sessionStorage.removeItem(transitionKey);
      }
    });

    $(document).on("click", "a", function(event) {
      var link = this;
      var url = new URL(link.href, window.location.href);

      if (!shouldTransition(link, event)) {
        return;
      }

      event.preventDefault();
      ensureVeil();
      if (url.origin === window.location.origin) {
        sessionStorage.setItem(transitionKey, "1");
      }
      document.body.classList.add("apple-transition-out");

      window.setTimeout(function() {
        window.location.href = link.href;
      }, 360);
    });
  })();

  /**
   * Shows the responsive navigation menu on mobile.
   */
  $("#header > #nav > ul > .icon").click(function() {
    $("#header > #nav > ul").toggleClass("responsive");
  });


  /**
   * Controls the different versions of  the menu in blog post articles 
   * for Desktop, tablet and mobile.
   */
  if ($(".post").length) {
    var menu = $("#menu");
    var nav = $("#menu > #nav");
    var menuIcon = $("#menu-icon, #menu-icon-tablet");

    /**
     * Display the menu on hi-res laptops and desktops.
     */
    if ($(document).width() >= 1440) {
      menu.show();
      menuIcon.addClass("active");
    }

    /**
     * Display the menu if the menu icon is clicked.
     */
    menuIcon.click(function() {
      if (menu.is(":hidden")) {
        menu.show();
        menuIcon.addClass("active");
      } else {
        menu.hide();
        menuIcon.removeClass("active");
      }
      return false;
    });

    /**
     * Add a scroll listener to the menu to hide/show the navigation links.
     */
    if (menu.length) {
      $(window).on("scroll", function() {
        var topDistance = menu.offset().top;

        // hide only the navigation links on desktop
        if (!nav.is(":visible") && topDistance < 50) {
          nav.show();
        } else if (nav.is(":visible") && topDistance > 100) {
          nav.hide();
        }

        // on tablet, hide the navigation icon as well and show a "scroll to top
        // icon" instead
        if ( ! $( "#menu-icon" ).is(":visible") && topDistance < 50 ) {
          $("#menu-icon-tablet").show();
          $("#top-icon-tablet").hide();
        } else if (! $( "#menu-icon" ).is(":visible") && topDistance > 100) {
          $("#menu-icon-tablet").hide();
          $("#top-icon-tablet").show();
        }
      });
    }

    /**
     * Show mobile navigation menu after scrolling upwards,
     * hide it again after scrolling downwards.
     */
    if ($( "#footer-post").length) {
      var lastScrollTop = 0;
      $(window).on("scroll", function() {
        var topDistance = $(window).scrollTop();

        if (topDistance > lastScrollTop){
          // downscroll -> show menu
          $("#footer-post").hide();
        } else {
          // upscroll -> hide menu
          $("#footer-post").show();
        }
        lastScrollTop = topDistance;

        // close all submenu"s on scroll
        $("#nav-footer").hide();
        $("#toc-footer").hide();
        $("#share-footer").hide();

        // show a "navigation" icon when close to the top of the page, 
        // otherwise show a "scroll to the top" icon
        if (topDistance < 50) {
          $("#actions-footer > #top").hide();
        } else if (topDistance > 100) {
          $("#actions-footer > #top").show();
        }
      });
    }
  }
});
