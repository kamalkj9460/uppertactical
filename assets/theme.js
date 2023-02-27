
/*
* @license
* Palo Alto Theme (c) Invisible Themes
*
* Modified versions of the theme code
* are not supported by Groupthought.
*
*/

(function (scrollLock, Flickity, Sqrl, themeCurrency, Ajaxinate, AOS) {
  'use strict';

  window.theme = window.theme || {};

  window.theme.sizes = {
    mobile: 480,
    small: 768,
    large: 1024,
    widescreen: 1440,
  };

  window.theme.keyboardKeys = {
    TAB: 9,
    ENTER: 13,
    ESCAPE: 27,
    SPACE: 32,
    LEFTARROW: 37,
    RIGHTARROW: 39,
  };

  window.theme.focusable = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  function debounce(fn, time) {
    let timeout;
    return function () {
      // eslint-disable-next-line prefer-rest-params
      if (fn) {
        const functionCall = () => fn.apply(this, arguments);
        clearTimeout(timeout);
        timeout = setTimeout(functionCall, time);
      }
    };
  }

  const selectors = {
    body: 'body',
    main: '[data-main]',
    header: '[data-site-header]',
    shopifySection: '.shopify-section',
    preventTransparentHeader: '[data-prevent-transparent-header]',
  };
  const classes = {
    transparentHeader: 'transparent-header',
    siteHeaderTransparent: 'site-header--transparent',
    hasTransparentHeader: 'has-transparent-header',
  };

  const attributes = {
    dataTransparent: 'data-transparent',
  };

  const initTransparentHeader = () => {
    // Determine what is the first
    const body = document.querySelector(selectors.body);
    const header = body.querySelector(selectors.header);
    const headerTransparent = header.getAttribute(attributes.dataTransparent) === 'true';
    const firstSection = body.querySelector(selectors.main).children[0];

    if (!firstSection) {
      return;
    }

    const preventTransparentHeader = firstSection.querySelector(`${selectors.preventTransparentHeader}:first-of-type`);
    isHeaderTransparent = headerTransparent && firstSection.classList.contains(classes.transparentHeader) && !preventTransparentHeader;

    // Set transparent header class
    if (isHeaderTransparent) {
      header.classList.add(classes.siteHeaderTransparent);
      body.classList.add(classes.hasTransparentHeader);
    } else {
      header.classList.remove(classes.siteHeaderTransparent);
      body.classList.remove(classes.hasTransparentHeader);
    }
  };

  const selectors$1 = {
    header: '[data-site-header]',
    pageContainer: '[data-page-container]',
    templateListCollections: '.template-list-collections',
    collectionFilters: '[data-collection-filters]',
  };
  const classes$1 = {
    hasScrolled: 'has-scrolled',
    headerSticky: 'header--sticky',
    headerRelative: 'header--relative',
  };

  const setMainSpacing = () => {
    // Reset header to its initial state in order to calculate the proper header height
    document.body.classList.remove(classes$1.hasScrolled);

    const pageContainer = document.querySelector(selectors$1.pageContainer);
    const header = document.querySelector(selectors$1.header);
    const headerSection = header.parentNode;
    const isHeaderSticky = header.dataset.position == 'fixed';
    const isListCollectionsTemplate = document.querySelector(selectors$1.templateListCollections);
    const hasCollectionFilters = document.querySelector(selectors$1.collectionFilters);
    const headerHeight = !isHeaderTransparent ? parseInt(header.clientHeight) : 0;

    // Define the initial header height
    window.initialHeaderHeight = parseInt(header.dataset.height);

    // Set main header push if the first section doesn't use transparent header
    pageContainer.style.paddingTop = headerHeight + 'px';

    // Update header position
    if (isHeaderSticky && !hasCollectionFilters) {
      headerSection.classList.add(classes$1.headerSticky);
    } else {
      headerSection.classList.remove(classes$1.headerSticky);
    }

    if (!isHeaderSticky && isListCollectionsTemplate) {
      headerSection.classList.add(classes$1.headerRelative);
    }

    // Update header state
    document.dispatchEvent(new CustomEvent('theme:scroll'), {bubbles: false});
  };

  let screenOrientation = getScreenOrientation();

  function readHeights() {
    const h = {};
    h.windowHeight = Math.min(window.screen.height, window.innerHeight);
    h.footerHeight = getHeight('[data-section-type*="footer"]');
    h.headerHeight = getHeight('[data-header-height]');
    h.announcementBarHeight = getHeight('[data-announcement-bar]');
    h.collectionStickyBarHeight = getHeight('[data-collection-sticky-bar]');
    return h;
  }

  function setVarsOnResize() {
    document.addEventListener('theme:resize', resizeVars);
    setVars();
  }

  function setVars() {
    const {windowHeight, headerHeight, announcementBarHeight, footerHeight, collectionStickyBarHeight} = readHeights();
    const contentFullHeight = window.isHeaderTransparent && checkFirstSectionTransparency() ? windowHeight - announcementBarHeight : windowHeight - headerHeight - announcementBarHeight;

    document.documentElement.style.setProperty('--full-height', `${windowHeight}px`);
    document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);

    document.documentElement.style.setProperty('--footer-height', `${footerHeight}px`);
    document.documentElement.style.setProperty('--content-full', `${contentFullHeight}px`);
    document.documentElement.style.setProperty('--content-min', `${windowHeight - headerHeight - footerHeight}px`);

    document.documentElement.style.setProperty('--collection-sticky-bar-height', `${collectionStickyBarHeight}px`);
  }

  function resizeVars() {
    // restrict the heights that are changed on resize to avoid iOS jump when URL bar is shown and hidden
    const {windowHeight, headerHeight, announcementBarHeight, footerHeight, collectionStickyBarHeight} = readHeights();
    const currentScreenOrientation = getScreenOrientation();
    const contentFullHeight = window.isHeaderTransparent && checkFirstSectionTransparency() ? windowHeight - announcementBarHeight : windowHeight - headerHeight - announcementBarHeight;

    if (currentScreenOrientation !== screenOrientation) {
      // Only update the heights on screen orientation change
      document.documentElement.style.setProperty('--full-height', `${windowHeight}px`);

      // Update the screen orientation state
      screenOrientation = currentScreenOrientation;
    }

    document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);

    document.documentElement.style.setProperty('--footer-height', `${footerHeight}px`);
    document.documentElement.style.setProperty('--content-full', `${contentFullHeight}px`);
    document.documentElement.style.setProperty('--content-min', `${windowHeight - headerHeight - footerHeight}px`);

    document.documentElement.style.setProperty('--collection-sticky-bar-height', `${collectionStickyBarHeight}px`);
  }

  function getHeight(selector) {
    const el = document.querySelector(selector);
    if (el) {
      return el.clientHeight;
    } else {
      return 0;
    }
  }

  function checkFirstSectionTransparency() {
    const firstSection = document.querySelector('[data-main]').firstElementChild;
    return firstSection.classList.contains('transparent-header');
  }

  function getScreenOrientation() {
    if (window.matchMedia('(orientation: portrait)').matches) {
      return 'portrait';
    }

    if (window.matchMedia('(orientation: landscape)').matches) {
      return 'landscape';
    }
  }

  const selectors$2 = {
    overflowBackground: '[data-overflow-background]',
    overflowFrame: '[data-overflow-frame]',
    overflowContent: '[data-overflow-content]',
    overflowContainer: '[data-overflow-container]',
    overflowWrapper: '[data-overflow-wrapper]',
  };

  function singles(frame, wrappers) {
    // sets the height of any frame passed in with the
    // tallest preventOverflowContent as well as any image in that frame
    let tallest = 0;

    wrappers.forEach((wrap) => {
      tallest = wrap.offsetHeight > tallest ? wrap.offsetHeight : tallest;
    });
    const images = frame.querySelectorAll(selectors$2.overflowBackground);
    const frames = [frame, ...images];
    frames.forEach((el) => {
      el.style.setProperty('min-height', `calc(${tallest}px + var(--header-height))`);
    });
  }

  function doubles(section) {
    if (window.innerWidth < window.theme.sizes.small) {
      // if we are below the small breakpoint, the double section acts like two independent
      // single frames
      let singleFrames = section.querySelectorAll(selectors$2.overflowFrame);
      singleFrames.forEach((singleframe) => {
        const wrappers = singleframe.querySelectorAll(selectors$2.overflowContent);
        singles(singleframe, wrappers);
      });
      return;
    }

    let tallest = 0;

    const frames = section.querySelectorAll(selectors$2.overflowFrame);
    const contentWrappers = section.querySelectorAll(selectors$2.overflowContent);
    contentWrappers.forEach((content) => {
      if (content.offsetHeight > tallest) {
        tallest = content.offsetHeight;
      }
    });
    const images = section.querySelectorAll(selectors$2.overflowBackground);
    let applySizes = [...frames, ...images];
    applySizes.forEach((el) => {
      el.style.setProperty('min-height', `${tallest}px`);
    });
    section.style.setProperty('min-height', `${tallest}px`);
  }

  function preventOverflow(container) {
    const singleFrames = container.querySelectorAll(selectors$2.overflowContainer);
    if (singleFrames) {
      singleFrames.forEach((frame) => {
        const wrappers = frame.querySelectorAll(selectors$2.overflowContent);
        singles(frame, wrappers);
        document.addEventListener('theme:resize', () => {
          singles(frame, wrappers);
        });
      });
    }

    const doubleSections = container.querySelectorAll(selectors$2.overflowWrapper);
    if (doubleSections) {
      doubleSections.forEach((section) => {
        doubles(section);
        document.addEventListener('theme:resize', () => {
          doubles(section);
        });
      });
    }
  }

  window.lastWindowWidth = window.innerWidth;

  function dispatchResizeEvent() {
    document.dispatchEvent(
      new CustomEvent('theme:resize', {
        bubbles: true,
      })
    );

    if (window.lastWindowWidth !== window.innerWidth) {
      document.dispatchEvent(
        new CustomEvent('theme:resize:width', {
          bubbles: true,
        })
      );

      window.lastWindowWidth = window.innerWidth;
    }
  }

  function resizeListener() {
    window.addEventListener('resize', debounce(dispatchResizeEvent, 50));
  }

  let prev = window.pageYOffset;
  let up = null;
  let down = null;
  let wasUp = null;
  let wasDown = null;
  let scrollLockTimer = 0;

  const classes$2 = {
    quickViewVisible: 'js-quick-view-visible',
    cartDrawerOpen: 'js-drawer-open-cart',
  };

  function dispatchScrollEvent() {
    const position = window.pageYOffset;
    if (position > prev) {
      down = true;
      up = false;
    } else if (position < prev) {
      down = false;
      up = true;
    } else {
      up = null;
      down = null;
    }
    prev = position;
    document.dispatchEvent(
      new CustomEvent('theme:scroll', {
        detail: {
          up,
          down,
          position,
        },
        bubbles: false,
      })
    );
    if (up && !wasUp) {
      document.dispatchEvent(
        new CustomEvent('theme:scroll:up', {
          detail: {position},
          bubbles: false,
        })
      );
    }
    if (down && !wasDown) {
      document.dispatchEvent(
        new CustomEvent('theme:scroll:down', {
          detail: {position},
          bubbles: false,
        })
      );
    }
    wasDown = down;
    wasUp = up;
  }

  function lock(e) {
    // Prevent body scroll lock race conditions
    setTimeout(() => {
      if (scrollLockTimer) {
        clearTimeout(scrollLockTimer);
      }

      scrollLock.disablePageScroll(e.detail, {
        allowTouchMove: (el) => el.tagName === 'TEXTAREA',
      });

      document.documentElement.setAttribute('data-scroll-locked', '');
    });
  }

  function unlock(e) {
    const timeout = e.detail;

    if (timeout) {
      scrollLockTimer = setTimeout(removeScrollLock, timeout);
    } else {
      removeScrollLock();
    }
  }

  function removeScrollLock() {
    const isPopupVisible = document.body.classList.contains(classes$2.quickViewVisible) || document.body.classList.contains(classes$2.cartDrawerOpen);

    if (!isPopupVisible) {
      scrollLock.clearQueueScrollLocks();
      scrollLock.enablePageScroll();
      document.documentElement.removeAttribute('data-scroll-locked');
    }
  }

  function scrollListener() {
    let timeout;
    window.addEventListener(
      'scroll',
      function () {
        if (timeout) {
          window.cancelAnimationFrame(timeout);
        }
        timeout = window.requestAnimationFrame(function () {
          dispatchScrollEvent();
        });
      },
      {passive: true}
    );

    window.addEventListener('theme:scroll:lock', lock);
    window.addEventListener('theme:scroll:unlock', unlock);
  }

  const wrap = (toWrap, wrapperClass = '', wrapperOption) => {
    const wrapper = wrapperOption || document.createElement('div');
    wrapper.classList.add(wrapperClass);
    wrapper.setAttribute('data-scroll-lock-scrollable', '');
    toWrap.parentNode.insertBefore(wrapper, toWrap);
    return wrapper.appendChild(toWrap);
  };

  function wrapElements(container) {
    // Target tables to make them scrollable
    const tableSelectors = 'table';
    const tables = document.querySelectorAll(tableSelectors);
    tables.forEach((table) => {
      wrap(table, 'table-wrapper');
    });
  }

  function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
  }

  function isTouch() {
    if (isTouchDevice()) {
      document.documentElement.className = document.documentElement.className.replace('no-touch', 'supports-touch');
      window.theme.touch = true;
    } else {
      window.theme.touch = false;
    }
  }

  function loading() {
    document.documentElement.classList.remove('is-loading');
  }

  resizeListener();
  scrollListener();
  isTouch();

  const headerFunctions = debounce(() => {
    // Recheck sticky header settings if section is set to hidden
    initTransparentHeader();
    setMainSpacing();
  }, 300);

  window.addEventListener('load', () => {
    setVarsOnResize();
    preventOverflow(document);
    wrapElements();
    loading();
  });

  document.addEventListener('shopify:section:load', (e) => {
    const container = e.target;

    window.dispatchEvent(new Event('resize'), {bubbles: true});

    preventOverflow(container);
    wrapElements();
    setVarsOnResize();

    headerFunctions();
  });

  document.addEventListener('shopify:section:reorder', () => {
    headerFunctions();
  });

  document.addEventListener('shopify:section:unload', () => {
    headerFunctions();
  });

  document.addEventListener('theme:resize:width', setMainSpacing);

  (function () {
    function n(n) {
      var i = window.innerWidth || document.documentElement.clientWidth,
        r = window.innerHeight || document.documentElement.clientHeight,
        t = n.getBoundingClientRect();
      return t.top >= 0 && t.bottom <= r && t.left >= 0 && t.right <= i;
    }
    function t(n) {
      var i = window.innerWidth || document.documentElement.clientWidth,
        r = window.innerHeight || document.documentElement.clientHeight,
        t = n.getBoundingClientRect(),
        u = (t.left >= 0 && t.left <= i) || (t.right >= 0 && t.right <= i),
        f = (t.top >= 0 && t.top <= r) || (t.bottom >= 0 && t.bottom <= r);
      return u && f;
    }
    function i(n, i) {
      function r() {
        var r = t(n);
        r != u && ((u = r), typeof i == 'function' && i(r, n));
      }
      var u = t(n);
      window.addEventListener('load', r);
      window.addEventListener('resize', r);
      window.addEventListener('scroll', r);
    }
    function r(t, i) {
      function r() {
        var r = n(t);
        r != u && ((u = r), typeof i == 'function' && i(r, t));
      }
      var u = n(t);
      window.addEventListener('load', r);
      window.addEventListener('resize', r);
      window.addEventListener('scroll', r);
    }
    window.visibilityHelper = {isElementTotallyVisible: n, isElementPartiallyVisible: t, inViewportPartially: i, inViewportTotally: r};
  })();

  const throttle = (fn, wait) => {
    let prev, next;
    return function invokeFn(...args) {
      const now = Date.now();
      next = clearTimeout(next);
      if (!prev || now - prev >= wait) {
        // eslint-disable-next-line prefer-spread
        fn.apply(null, args);
        prev = now;
      } else {
        next = setTimeout(invokeFn.bind(null, ...args), wait - (now - prev));
      }
    };
  };

  const slideUp = (target, duration = 500) => {
    target.style.transitionProperty = 'height, margin, padding';
    target.style.transitionDuration = duration + 'ms';
    target.style.boxSizing = 'border-box';
    target.style.height = target.offsetHeight + 'px';
    target.offsetHeight;
    target.style.overflow = 'hidden';
    target.style.height = 0;
    target.style.paddingTop = 0;
    target.style.paddingBottom = 0;
    target.style.marginTop = 0;
    target.style.marginBottom = 0;
    window.setTimeout(() => {
      target.style.display = 'none';
      target.style.removeProperty('height');
      target.style.removeProperty('padding-top');
      target.style.removeProperty('padding-bottom');
      target.style.removeProperty('margin-top');
      target.style.removeProperty('margin-bottom');
      target.style.removeProperty('overflow');
      target.style.removeProperty('transition-duration');
      target.style.removeProperty('transition-property');
    }, duration);
  };

  const slideDown = (target, duration = 500, showDisplay = 'block', checkHidden = true) => {
    let display = window.getComputedStyle(target).display;
    if (checkHidden && display !== 'none') {
      return;
    }
    target.style.removeProperty('display');
    if (display === 'none') display = showDisplay;
    target.style.display = display;
    let height = target.offsetHeight;
    target.style.overflow = 'hidden';
    target.style.height = 0;
    target.style.paddingTop = 0;
    target.style.paddingBottom = 0;
    target.style.marginTop = 0;
    target.style.marginBottom = 0;
    target.offsetHeight;
    target.style.boxSizing = 'border-box';
    target.style.transitionProperty = 'height, margin, padding';
    target.style.transitionDuration = duration + 'ms';
    target.style.height = height + 'px';
    target.style.removeProperty('padding-top');
    target.style.removeProperty('padding-bottom');
    target.style.removeProperty('margin-top');
    target.style.removeProperty('margin-bottom');
    window.setTimeout(() => {
      target.style.removeProperty('height');
      target.style.removeProperty('overflow');
      target.style.removeProperty('transition-duration');
      target.style.removeProperty('transition-property');
    }, duration);
  };

  function FetchError(object) {
    this.status = object.status || null;
    this.headers = object.headers || null;
    this.json = object.json || null;
    this.body = object.body || null;
  }
  FetchError.prototype = Error.prototype;

  const selectors$3 = {
    single: '[data-collapsible-single]', // Add this attribute when we want only one item expanded at the same time
    trigger: '[data-collapsible-trigger]',
    content: '[data-collapsible-content]',
  };

  const classes$3 = {
    isExpanded: 'is-expanded',
  };

  const attributes$1 = {
    expanded: 'aria-expanded',
    controls: 'aria-controls',
    hidden: 'aria-hidden',
    triggerMobile: 'data-collapsible-trigger-mobile',
    transitionOverride: 'data-collapsible-transition-override',
  };

  const settings = {
    animationDelay: 500,
  };

  const sections = {};

  class Collapsible {
    constructor(container) {
      this.container = container;
      this.single = this.container.querySelector(selectors$3.single);
      this.triggers = this.container.querySelectorAll(selectors$3.trigger);
      this.resetHeightTimer = 0;
      this.isTransitioning = false;
      this.transitionOverride = this.container.hasAttribute(attributes$1.transitionOverride);
      this.collapsibleToggleEvent = (event) => throttle(this.collapsibleToggle(event), 1250);

      this.init();
    }

    init() {
      this.triggers.forEach((trigger) => {
        trigger.addEventListener('click', this.collapsibleToggleEvent);
        trigger.addEventListener('keyup', this.collapsibleToggleEvent);
      });
    }

    collapsibleToggle(e) {
      e.preventDefault();

      const trigger = e.target.matches(selectors$3.trigger) ? e.target : e.target.closest(selectors$3.trigger);
      const dropdownId = trigger.getAttribute(attributes$1.controls);
      const dropdown = document.getElementById(dropdownId);
      const triggerMobile = trigger.hasAttribute(attributes$1.triggerMobile);
      const isExpanded = trigger.classList.contains(classes$3.isExpanded);
      const isSpace = e.keyCode === theme.keyboardKeys.SPACE;
      const isEscape = e.keyCode === theme.keyboardKeys.ESCAPE;
      const isMobile = window.innerWidth < theme.sizes.small;

      // Do nothing if transitioning
      if (this.isTransitioning && !this.transitionOverride) {
        return;
      }

      // Do nothing if any different than ESC and Space key pressed
      if (e.keyCode && !isSpace && !isEscape) {
        return;
      }

      // Do nothing if ESC key pressed and not expanded or mobile trigger clicked and screen not mobile
      if ((!isExpanded && isEscape) || (triggerMobile && !isMobile)) {
        return;
      }

      this.isTransitioning = true;
      trigger.disabled = true;

      // When we want only one item expanded at the same time
      if (this.single) {
        this.triggers.forEach((otherTrigger) => {
          const isExpanded = otherTrigger.classList.contains(classes$3.isExpanded);

          if (trigger == otherTrigger || !isExpanded) return;

          const dropdownId = otherTrigger.getAttribute(attributes$1.controls);
          const dropdown = document.getElementById(dropdownId);

          this.closeItem(dropdown, otherTrigger);
        });
      }

      if (isExpanded) {
        this.closeItem(dropdown, trigger);
      } else {
        this.openItem(dropdown, trigger);
      }
    }

    openItem(dropdown, trigger) {
      let dropdownHeight = dropdown.querySelector(selectors$3.content).offsetHeight;

      this.setDropdownHeight(dropdown, dropdownHeight, trigger, false);
      trigger.classList.add(classes$3.isExpanded);
      trigger.setAttribute(attributes$1.expanded, true);

      trigger.dispatchEvent(
        new CustomEvent('theme:form:sticky', {
          bubbles: true,
          detail: {
            element: 'accordion',
          },
        })
      );
    }

    closeItem(dropdown, trigger) {
      let dropdownHeight = dropdown.querySelector(selectors$3.content).offsetHeight;

      requestAnimationFrame(() => {
        dropdownHeight = 0;
        this.setDropdownHeight(dropdown, dropdownHeight, trigger, true);
        trigger.classList.remove(classes$3.isExpanded);
      });

      this.setDropdownHeight(dropdown, dropdownHeight, trigger, true);
      trigger.classList.remove(classes$3.isExpanded);
      trigger.setAttribute(attributes$1.expanded, false);
    }

    setDropdownHeight(dropdown, dropdownHeight, trigger, isExpanded) {
      dropdown.style.height = `${dropdownHeight}px`;
      dropdown.setAttribute(attributes$1.hidden, isExpanded);
      dropdown.classList.toggle(classes$3.isExpanded, !isExpanded);

      if (this.resetHeightTimer) {
        clearTimeout(this.resetHeightTimer);
      }

      if (dropdownHeight == 0) {
        this.resetHeightTimer = setTimeout(() => {
          dropdown.style.height = '';
        }, settings.animationDelay);
      }

      if (!isExpanded) {
        this.resetHeightTimer = setTimeout(() => {
          dropdown.style.height = 'auto';
          this.isTransitioning = false;
        }, settings.animationDelay);
      } else {
        this.isTransitioning = false;
      }

      // Always remove trigger disabled attribute after animation completes
      setTimeout(() => {
        trigger.disabled = false;
      }, settings.animationDelay);
    }

    onUnload() {
      this.triggers.forEach((trigger) => {
        trigger.removeEventListener('click', this.collapsibleToggleEvent);
        trigger.removeEventListener('keyup', this.collapsibleToggleEvent);
      });
    }
  }

  const collapsible = {
    onLoad() {
      sections[this.id] = new Collapsible(this.container);
    },
    onUnload() {
      sections[this.id].onUnload();
    },
  };

  const selectors$4 = {
    quantityHolder: '[data-quantity-holder]',
    quantityField: '[data-quantity-field]',
    quantityButton: '[data-quantity-button]',
    quantityMinusButton: '[data-quantity-minus]',
    quantityPlusButton: '[data-quantity-plus]',
  };

  const classes$4 = {
    quantityReadOnly: 'read-only',
    isDisabled: 'is-disabled',
  };

  class QuantityCounter {
    constructor(holder, inCart = false) {
      this.holder = holder;
      this.quantityUpdateCart = inCart;
    }

    init() {
      // DOM Elements
      this.quantity = this.holder.querySelector(selectors$4.quantityHolder);

      if (!this.quantity) {
        return;
      }

      this.field = this.quantity.querySelector(selectors$4.quantityField);
      this.buttons = this.quantity.querySelectorAll(selectors$4.quantityButton);
      this.increaseButton = this.quantity.querySelector(selectors$4.quantityPlusButton);

      // Set value or classes
      this.quantityValue = Number(this.field.value || 0);
      this.cartItemID = this.field.getAttribute('data-id');
      this.maxValue = Number(this.field.getAttribute('max')) > 0 ? Number(this.field.getAttribute('max')) : null;
      this.minValue = Number(this.field.getAttribute('min')) > 0 ? Number(this.field.getAttribute('min')) : 0;
      this.disableIncrease = this.disableIncrease.bind(this);

      // Flags
      this.emptyField = false;

      // Methods
      this.updateQuantity = this.updateQuantity.bind(this);
      this.decrease = this.decrease.bind(this);
      this.increase = this.increase.bind(this);

      this.disableIncrease();

      // Events
      if (!this.quantity.classList.contains(classes$4.quantityReadOnly)) {
        this.changeValueOnClick();
        this.changeValueOnInput();
      }
    }

    /**
     * Change field value when click on quantity buttons
     *
     * @return  {Void}
     */

    changeValueOnClick() {
      this.buttons.forEach((element) => {
        element.addEventListener('click', (event) => {
          event.preventDefault();
          const clickedElement = event.target;
          const isDescrease = clickedElement.matches(selectors$4.quantityMinusButton) || clickedElement.closest(selectors$4.quantityMinusButton);
          const isIncrease = clickedElement.matches(selectors$4.quantityPlusButton) || clickedElement.closest(selectors$4.quantityPlusButton);

          if (isDescrease) {
            this.decrease();
          }

          if (isIncrease) {
            this.increase();
          }

          this.updateQuantity();
        });
      });
    }

    /**
     * Change field value when input new value in a field
     *
     * @return  {Void}
     */

    changeValueOnInput() {
      this.field.addEventListener('input', (e) => {
        this.quantityValue = this.field.value;

        if (this.value === '') {
          this.emptyField = true;
        }

        this.updateQuantity();
      });
    }

    /**
     * Update field value
     *
     * @return  {Void}
     */

    updateQuantity() {
      if (this.maxValue < this.quantityValue && this.maxValue !== null) {
        this.quantityValue = this.maxValue;
      }

      if (this.minValue > this.quantityValue) {
        this.quantityValue = this.minValue;
      }

      this.field.value = this.quantityValue;

      this.disableIncrease();

      document.dispatchEvent(new CustomEvent('theme:cart:update'));

      if (this.quantityUpdateCart) {
        this.updateCart();
      }
    }

    /**
     * Decrease value
     *
     * @return  {Void}
     */

    decrease() {
      if (this.quantityValue > this.minValue) {
        this.quantityValue--;

        return;
      }

      this.quantityValue = 0;
    }

    /**
     * Increase value
     *
     * @return  {Void}
     */

    increase() {
      this.quantityValue++;
    }

    /**
     * Disable increase
     *
     * @return  {[type]}  [return description]
     */

    disableIncrease() {
      this.increaseButton.classList.toggle(classes$4.isDisabled, this.quantityValue >= this.maxValue && this.maxValue !== null);
    }

    updateCart() {
      const event = new CustomEvent('theme:cart:update', {
        bubbles: true,
        detail: {
          id: this.cartItemID,
          quantity: this.quantityValue,
          valueIsEmpty: this.emptyField,
        },
      });

      this.holder.dispatchEvent(event);
    }
  }

  const a11y = {
    /**
     * A11y Helpers
     * -----------------------------------------------------------------------------
     * A collection of useful functions that help make your theme more accessible
     */

    state: {
      firstFocusable: null,
      lastFocusable: null,
      trigger: null,
    },

    trapFocus: function (options) {
      var focusableElements = Array.from(options.container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex^="-"])')).filter(function (element) {
        var width = element.offsetWidth;
        var height = element.offsetHeight;

        return width !== 0 && height !== 0 && getComputedStyle(element).getPropertyValue('display') !== 'none';
      });

      focusableElements = focusableElements.filter(function (element) {
        return !element.classList.contains('deferred-media__poster');
      });

      this.state.firstFocusable = focusableElements[0];
      this.state.lastFocusable = focusableElements[focusableElements.length - 1];

      if (!options.elementToFocus) {
        options.elementToFocus = this.state.firstFocusable || options.container;
      }
      this._setupHandlers();

      document.addEventListener('focusin', this._onFocusInHandler);
      document.addEventListener('focusout', this._onFocusOutHandler);

      options.container.setAttribute('tabindex', '-1');
      options.elementToFocus.focus();
    },

    removeTrapFocus: function (options) {
      const focusVisible = !document.body.classList.contains('no-outline');
      if (options && options.container) {
        options.container.removeAttribute('tabindex');
      }
      document.removeEventListener('focusin', this._onFocusInHandler);

      if (this.state.trigger && focusVisible) {
        this.state.trigger.focus();
      }
    },

    _manageFocus: function (evt) {
      if (evt.keyCode !== theme.keyboardKeys.TAB) {
        return;
      }

      /**
       * On the last focusable element and tab forward,
       * focus the first element.
       */
      if (evt.target === this.state.lastFocusable && !evt.shiftKey) {
        evt.preventDefault();
        this.state.firstFocusable.focus();
      }

      /**
       * On the first focusable element and tab backward,
       * focus the last element.
       */
      if (evt.target === this.state.firstFocusable && evt.shiftKey) {
        evt.preventDefault();
        this.state.lastFocusable.focus();
      }
    },

    _onFocusOut: function () {
      document.removeEventListener('keydown', this._manageFocusHandler);
    },

    _onFocusIn: function (evt) {
      if (evt.target !== this.state.lastFocusable && evt.target !== this.state.firstFocusable) {
        return;
      }

      document.addEventListener('keydown', this._manageFocusHandler);
    },

    _setupHandlers: function () {
      if (!this._onFocusInHandler) {
        this._onFocusInHandler = this._onFocusIn.bind(this);
      }

      if (!this._onFocusOutHandler) {
        this._onFocusOutHandler = this._onFocusIn.bind(this);
      }

      if (!this._manageFocusHandler) {
        this._manageFocusHandler = this._manageFocus.bind(this);
      }
    },
  };

  function getScript(url, callback, callbackError) {
    let head = document.getElementsByTagName('head')[0];
    let done = false;
    let script = document.createElement('script');
    script.src = url;

    // Attach handlers for all browsers
    script.onload = script.onreadystatechange = function () {
      if (!done && (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete')) {
        done = true;
        callback();
      } else {
        callbackError();
      }
    };

    head.appendChild(script);
  }

  const loaders = {};
  window.isYoutubeAPILoaded = false;
  window.isVimeoAPILoaded = false;

  function loadScript(options = {}) {
    if (!options.type) {
      options.type = 'json';
    }

    if (options.url) {
      if (loaders[options.url]) {
        return loaders[options.url];
      } else {
        return getScriptWithPromise(options.url, options.type);
      }
    } else if (options.json) {
      if (loaders[options.json]) {
        return Promise.resolve(loaders[options.json]);
      } else {
        return window
          .fetch(options.json)
          .then((response) => {
            return response.json();
          })
          .then((response) => {
            loaders[options.json] = response;
            return response;
          });
      }
    } else if (options.name) {
      const key = ''.concat(options.name, options.version);
      if (loaders[key]) {
        return loaders[key];
      } else {
        return loadShopifyWithPromise(options);
      }
    } else {
      return Promise.reject();
    }
  }

  function getScriptWithPromise(url, type) {
    const loader = new Promise((resolve, reject) => {
      if (type === 'text') {
        fetch(url)
          .then((response) => response.text())
          .then((data) => {
            resolve(data);
          })
          .catch((error) => {
            reject(error);
          });
      } else {
        getScript(
          url,
          function () {
            resolve();
          },
          function () {
            reject();
          }
        );
      }
    });

    loaders[url] = loader;
    return loader;
  }

  function loadShopifyWithPromise(options) {
    const key = ''.concat(options.name, options.version);
    const loader = new Promise((resolve, reject) => {
      try {
        window.Shopify.loadFeatures([
          {
            name: options.name,
            version: options.version,
            onLoad: (err) => {
              onLoadFromShopify(resolve, reject, err);
            },
          },
        ]);
      } catch (err) {
        reject(err);
      }
    });
    loaders[key] = loader;
    return loader;
  }

  function onLoadFromShopify(resolve, reject, err) {
    if (err) {
      return reject(err);
    } else {
      return resolve();
    }
  }

  const selectors$5 = {
    videoIframe: '[data-video-id]',
  };

  const classes$5 = {
    loaded: 'loaded',
  };

  const attributes$2 = {
    dataEnableSound: 'data-enable-sound',
    dataEnableBackground: 'data-enable-background',
    dataEnableAutoplay: 'data-enable-autoplay',
    dataEnableLoop: 'data-enable-loop',
    dataVideoId: 'data-video-id',
    dataVideoType: 'data-video-type',
  };

  class LoadVideoVimeo {
    constructor(container) {
      this.container = container;
      this.player = this.container.querySelector(selectors$5.videoIframe);

      if (this.player) {
        this.videoID = this.player.getAttribute(attributes$2.dataVideoId);
        this.videoType = this.player.getAttribute(attributes$2.dataVideoType);
        this.enableBackground = this.player.getAttribute(attributes$2.dataEnableBackground) === 'true';
        this.disableSound = this.player.getAttribute(attributes$2.dataEnableSound) === 'false';
        this.enableAutoplay = this.player.getAttribute(attributes$2.dataEnableAutoplay) !== 'false';
        this.enableLoop = this.player.getAttribute(attributes$2.dataEnableLoop) !== 'false';

        if (this.videoType == 'vimeo') {
          this.init();
        }
      }
    }

    init() {
      this.loadVimeoPlayer();
    }

    loadVimeoPlayer() {
      const oembedUrl = 'https://vimeo.com/api/oembed.json';
      const vimeoUrl = 'https://vimeo.com/' + this.videoID;
      let paramsString = '';
      const state = this.player;

      const params = {
        url: vimeoUrl,
        background: this.enableBackground,
        muted: this.disableSound,
        autoplay: this.enableAutoplay,
        loop: this.enableLoop,
      };

      for (let key in params) {
        paramsString += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&';
      }

      fetch(`${oembedUrl}?${paramsString}`)
        .then((response) => response.json())
        .then(function (data) {
          state.innerHTML = data.html;

          setTimeout(function () {
            state.parentElement.classList.add(classes$5.loaded);
          }, 1000);
        })
        .catch(function () {
          console.log('error');
        });
    }
  }

  const selectors$6 = {
    videoIframe: '[data-video-id]',
    videoWrapper: '.video-wrapper',
    youtubeWrapper: '[data-youtube-wrapper]',
  };

  const attributes$3 = {
    dataSectionId: 'data-section-id',
    dataEnableSound: 'data-enable-sound',
    dataHideOptions: 'data-hide-options',
    dataCheckPlayerVisibility: 'data-check-player-visibility',
    dataVideoId: 'data-video-id',
    dataVideoType: 'data-video-type',
  };

  const classes$6 = {
    loaded: 'loaded',
  };

  const players = [];

  class LoadVideoYT {
    constructor(container) {
      this.container = container;
      this.player = this.container.querySelector(selectors$6.videoIframe);

      if (this.player) {
        this.videoOptionsVars = {};
        this.videoID = this.player.getAttribute(attributes$3.dataVideoId);
        this.videoType = this.player.getAttribute(attributes$3.dataVideoType);
        if (this.videoType == 'youtube') {
          this.checkPlayerVisibilityFlag = this.player.getAttribute(attributes$3.dataCheckPlayerVisibility) === 'true';
          this.playerID = this.player.querySelector(selectors$6.youtubeWrapper) ? this.player.querySelector(selectors$6.youtubeWrapper).id : this.player.id;
          if (this.player.hasAttribute(selectors$6.dataHideOptions)) {
            this.videoOptionsVars = {
              cc_load_policy: 0,
              iv_load_policy: 3,
              modestbranding: 1,
              playsinline: 1,
              autohide: 0,
              controls: 0,
              branding: 0,
              showinfo: 0,
              rel: 0,
              fs: 0,
              wmode: 'opaque',
            };
          }

          this.init();

          this.container.addEventListener('touchstart', function (e) {
            if (e.target.matches(selectors$6.videoWrapper) || e.target.closest(selectors$6.videoWrapper)) {
              const playerID = e.target.querySelector(selectors$6.videoIframe).id;
              players[playerID].playVideo();
            }
          });
        }
      }
    }

    init() {
      if (window.isYoutubeAPILoaded) {
        this.loadYoutubePlayer();
      } else {
        // Load Youtube API if not loaded yet
        loadScript({url: 'https://www.youtube.com/iframe_api'}).then(() => this.loadYoutubePlayer());
      }
    }

    loadYoutubePlayer() {
      const defaultYoutubeOptions = {
        height: '720',
        width: '1280',
        playerVars: this.videoOptionsVars,
        events: {
          onReady: (event) => {
            const eventIframe = event.target.getIframe();
            const id = eventIframe.id;
            const enableSound = document.querySelector(`#${id}`).getAttribute(attributes$3.dataEnableSound) === 'true';

            eventIframe.setAttribute('tabindex', '-1');

            if (enableSound) {
              event.target.unMute();
            } else {
              event.target.mute();
            }
            event.target.playVideo();

            if (this.checkPlayerVisibilityFlag) {
              this.checkPlayerVisibility(id);

              window.addEventListener(
                'scroll',
                throttle(() => {
                  this.checkPlayerVisibility(id);
                }, 150)
              );
            }
          },
          onStateChange: (event) => {
            // Loop video if state is ended
            if (event.data == 0) {
              event.target.playVideo();
            }
            if (event.data == 1) {
              // video is playing
              event.target.getIframe().parentElement.classList.add(classes$6.loaded);
            }
          },
        },
      };

      const currentYoutubeOptions = {...defaultYoutubeOptions};
      currentYoutubeOptions.videoId = this.videoID;
      if (this.videoID.length) {
        YT.ready(() => {
          players[this.playerID] = new YT.Player(this.playerID, currentYoutubeOptions);
        });
      }
      window.isYoutubeAPILoaded = true;
    }

    checkPlayerVisibility(id) {
      let playerID;
      if (typeof id === 'string') {
        playerID = id;
      } else if (id.data != undefined) {
        playerID = id.data.id;
      } else {
        return;
      }

      const playerElement = document.getElementById(playerID + '-container');
      if (!playerElement) {
        return;
      }
      const player = players[playerID];
      const box = playerElement.getBoundingClientRect();
      let isVisible = visibilityHelper.isElementPartiallyVisible(playerElement) || visibilityHelper.isElementTotallyVisible(playerElement);

      // Fix the issue when element height is bigger than the viewport height
      if (box.top < 0 && playerElement.clientHeight + box.top >= 0) {
        isVisible = true;
      }

      if (isVisible && player && typeof player.playVideo === 'function') {
        player.playVideo();
      } else if (!isVisible && player && typeof player.pauseVideo === 'function') {
        player.pauseVideo();
      }
    }

    onUnload() {
      const playerID = 'youtube-' + this.container.getAttribute(attributes$3.dataSectionId);
      if (!players[playerID]) {
        return;
      }
      players[playerID].destroy();
    }
  }

  const selectors$7 = {
    notificationForm: '[data-notification-form]',
    notification: '[data-notification]',
    popupClose: '[data-popup-close]',
  };

  const classes$7 = {
    popupSuccess: 'pswp--success',
    notificationPopupVisible: 'notification-popup-visible',
  };

  class LoadNotification {
    constructor(popup, pswpElement) {
      this.popup = popup;
      this.pswpElement = pswpElement;
      this.notificationForm = null;
      this.notificationStopSubmit = true;
      this.sessionStorage = window.sessionStorage;
      const notificationWrapper = this.pswpElement.querySelector(selectors$7.notification);
      this.outerCloseEvent = (e) => {
        if (!notificationWrapper.contains(e.target)) {
          this.popup.close();
        }
      };

      this.init();
    }

    init() {
      this.popup.listen('preventDragEvent', (e, isDown, preventObj) => {
        preventObj.prevent = false;
      });

      const notificationFormSuccess = window.location.search.indexOf('?customer_posted=true') !== -1;
      this.notificationForm = this.pswpElement.querySelector(selectors$7.notificationForm);
      const closeBtn = this.pswpElement.querySelector(selectors$7.popupClose);
      document.body.classList.add(classes$7.notificationPopupVisible);

      this.pswpElement.addEventListener('mousedown', () => {
        this.popup.framework.unbind(window, 'pointermove pointerup pointercancel', this.popup);
      });

      if (notificationFormSuccess) {
        this.pswpElement.classList.add(classes$7.popupSuccess);
      }

      this.notificationForm.addEventListener('submit', (e) => this.notificationSubmitEvent(e));

      // Custom closing events
      this.pswpElement.addEventListener('click', this.outerCloseEvent);

      closeBtn.addEventListener('click', () => {
        this.popup.close();
      });

      this.popup.listen('destroy', () => {
        this.notificationRemoveStorage();
        this.pswpElement.removeEventListener('click', this.outerCloseEvent);
        document.body.classList.remove(classes$7.notificationPopupVisible);
      });
    }

    notificationSubmitEvent(e) {
      if (this.notificationStopSubmit) {
        e.preventDefault();

        this.notificationRemoveStorage();
        this.notificationWriteStorage();
        this.notificationStopSubmit = false;
        this.notificationForm.submit();
      }
    }

    notificationWriteStorage() {
      if (this.sessionStorage !== undefined) {
        this.sessionStorage.setItem('notification_form_id', this.notificationForm.id);
      }
    }

    notificationRemoveStorage() {
      this.sessionStorage.removeItem('notification_form_id');
    }
  }

  // iOS smooth scrolling fix
  function flickitySmoothScrolling(slider) {
    const flkty = Flickity.data(slider);

    if (!flkty) {
      return;
    }

    flkty.on('dragStart', (event, pointer) => {
      document.ontouchmove = function (e) {
        e.preventDefault();
      };
    });

    flkty.on('dragEnd', (event, pointer) => {
      document.ontouchmove = function (e) {
        return true;
      };
    });
  }

  const hosts = {
    html5: 'html5',
    youtube: 'youtube',
    vimeo: 'vimeo',
  };

  const selectors$8 = {
    deferredMedia: '[data-deferred-media]',
    deferredMediaButton: '[data-deferred-media-button]',
    productMediaWrapper: '[data-product-single-media-wrapper]',
    mediaContainer: '[data-video]',
    mediaHidden: '.media--hidden',
  };

  const classes$8 = {
    mediaHidden: 'media--hidden',
  };

  const attributes$4 = {
    loaded: 'loaded',
    sectionId: 'data-section-id',
    dataAutoplayVideo: 'data-autoplay-video',
    mediaId: 'data-media-id',
  };

  class ProductVideo {
    constructor(container) {
      this.container = container;
      this.id = this.container.getAttribute(attributes$4.sectionId);
      this.autoplayVideo = this.container.getAttribute(attributes$4.dataAutoplayVideo) === 'true';
      this.players = {};
      this.init();
    }

    init() {
      const mediaContainers = this.container.querySelectorAll(selectors$8.mediaContainer);

      mediaContainers.forEach((mediaContainer) => {
        const deferredMediaButton = mediaContainer.querySelector(selectors$8.deferredMediaButton);

        if (deferredMediaButton) {
          deferredMediaButton.addEventListener('click', this.loadContent.bind(this, mediaContainer));
        }

        if (this.autoplayVideo) {
          this.loadContent(mediaContainer);
        }
      });
    }

    loadContent(mediaContainer) {
      if (mediaContainer.querySelector(selectors$8.deferredMedia).getAttribute(attributes$4.loaded)) {
        return;
      }

      const content = document.createElement('div');
      content.appendChild(mediaContainer.querySelector('template').content.firstElementChild.cloneNode(true));
      const mediaId = mediaContainer.dataset.mediaId;
      const element = content.querySelector('video, iframe');
      const host = this.hostFromVideoElement(element);
      const deferredMedia = mediaContainer.querySelector(selectors$8.deferredMedia);
      deferredMedia.appendChild(element);
      deferredMedia.setAttribute('loaded', true);

      this.players[mediaId] = {
        mediaId: mediaId,
        sectionId: this.id,
        container: mediaContainer,
        element: element,
        host: host,
        ready: () => {
          this.createPlayer(mediaId);
        },
      };

      const video = this.players[mediaId];

      switch (video.host) {
        case hosts.html5:
          this.loadVideo(video, hosts.html5);
          break;
        case hosts.vimeo:
          if (window.isVimeoAPILoaded) {
            this.loadVideo(video, hosts.vimeo);
          } else {
            loadScript({url: 'https://player.vimeo.com/api/player.js'}).then(() => this.loadVideo(video, hosts.vimeo));
          }
          break;
        case hosts.youtube:
          if (window.isYoutubeAPILoaded) {
            this.loadVideo(video, hosts.youtube);
          } else {
            loadScript({url: 'https://www.youtube.com/iframe_api'}).then(() => this.loadVideo(video, hosts.youtube));
          }
          break;
      }
    }

    hostFromVideoElement(video) {
      if (video.tagName === 'VIDEO') {
        return hosts.html5;
      }

      if (video.tagName === 'IFRAME') {
        if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtube-nocookie\.com|youtu\.?be)\/.+$/.test(video.src)) {
          return hosts.youtube;
        } else if (video.src.includes('vimeo.com')) {
          return hosts.vimeo;
        }
      }

      return null;
    }

    loadVideo(video, host) {
      if (video.host === host) {
        video.ready();
      }
    }

    createPlayer(mediaId) {
      const video = this.players[mediaId];

      switch (video.host) {
        case hosts.html5:
          video.element.addEventListener('play', () => {
            video.container.dispatchEvent(new CustomEvent('theme:media:play'), {bubbles: true});
          });

          video.element.addEventListener('pause', () => {
            video.container.dispatchEvent(new CustomEvent('theme:media:pause'), {bubbles: true});
          });

          if (this.autoplayVideo) {
            this.observeVideo(video, mediaId);
          }

          break;
        case hosts.vimeo:
          video.player = new Vimeo.Player(video.element);
          video.player.play(); // Force video play on iOS
          video.container.dispatchEvent(new CustomEvent('theme:media:play'), {bubbles: true});

          window.isVimeoAPILoaded = true;

          video.player.on('play', () => {
            video.container.dispatchEvent(new CustomEvent('theme:media:play'), {bubbles: true});
          });

          video.player.on('pause', () => {
            video.container.dispatchEvent(new CustomEvent('theme:media:pause'), {bubbles: true});
          });

          if (this.autoplayVideo) {
            this.observeVideo(video, mediaId);
          }

          break;
        case hosts.youtube:
          if (video.host == hosts.youtube && video.player) {
            return;
          }

          YT.ready(() => {
            const videoId = video.container.dataset.videoId;

            video.player = new YT.Player(video.element, {
              videoId: videoId,
              events: {
                onReady: (event) => {
                  event.target.playVideo(); // Force video play on iOS
                  video.container.dispatchEvent(new CustomEvent('theme:media:play'), {bubbles: true});
                },
                onStateChange: (event) => {
                  // Playing
                  if (event.data == 1) {
                    video.container.dispatchEvent(new CustomEvent('theme:media:play'), {bubbles: true});
                  }

                  // Paused
                  if (event.data == 2) {
                    video.container.dispatchEvent(new CustomEvent('theme:media:pause'), {bubbles: true});
                  }

                  // Ended
                  if (event.data == 0) {
                    video.container.dispatchEvent(new CustomEvent('theme:media:pause'), {bubbles: true});
                  }
                },
              },
            });

            window.isYoutubeAPILoaded = true;

            if (this.autoplayVideo) {
              this.observeVideo(video, mediaId);
            }
          });

          break;
      }

      video.container.addEventListener('theme:media:visible', (event) => this.onVisible(event));
      video.container.addEventListener('theme:media:hidden', (event) => this.onHidden(event));
      video.container.addEventListener('xrLaunch', (event) => this.onHidden(event));
    }

    observeVideo(video) {
      let observer = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            const outsideViewport = entry.intersectionRatio == 0;
            const isVisible = !video.element.closest(selectors$8.mediaHidden);

            if (outsideViewport) {
              this.pauseVideo(video);
            } else if (isVisible) {
              this.playVideo(video);
            }
          });
        },
        {threshold: 0}
      );
      observer.observe(video.element);
    }

    playVideo(video) {
      if (video.player && video.player.playVideo) {
        video.player.playVideo();
      } else if (video.element && video.element.play) {
        video.element.play();
      } else if (video.player && video.player.play) {
        video.player.play();
      }

      video.container.dispatchEvent(new CustomEvent('theme:media:play'), {bubbles: true});
    }

    pauseVideo(video) {
      if (video.player && video.player.pauseVideo) {
        // Youtube
        if (video.player.playerInfo.playerState == '1') {
          // If Youtube video is playing
          // There is no need to trigger the 'pause' event since we are listening for it when initializing the YT Video
          video.player.pauseVideo();
        }
      } else if (video.player && video.player.pause) {
        // Vimeo
        video.player.pause();
      } else if (video.element && !video.element.paused) {
        // HTML5
        // If HTML5 video is playing (we used .paused because there is no 'playing' property)
        video.element?.pause();
      }
    }

    onHidden(event) {
      if (typeof event.target.dataset.mediaId !== 'undefined') {
        const mediaId = event.target.dataset.mediaId;
        const video = this.players[mediaId];
        this.pauseVideo(video);
      }
    }

    onVisible(event) {
      if (typeof event.target.dataset.mediaId !== 'undefined') {
        const mediaId = event.target.dataset.mediaId;
        const video = this.players[mediaId];

        // Using a timeout so the video "play" event can triggers after the previous video "pause" event
        // because both events change the "draggable" option of the slider and we need to time it right
        setTimeout(() => {
          this.playVideo(video);
        }, 50);

        this.pauseOtherMedia(mediaId);
      }
    }

    pauseOtherMedia(mediaId) {
      const currentMedia = `[${attributes$4.mediaId}="${mediaId}"]`;
      const otherMedia = document.querySelectorAll(`${selectors$8.productMediaWrapper}:not(${currentMedia})`);

      if (otherMedia.length) {
        otherMedia.forEach((media) => {
          media.dispatchEvent(new CustomEvent('theme:media:hidden'), {bubbles: true});
          media.classList.add(classes$8.mediaHidden);
        });
      }
    }
  }

  const showElement = (elem, removeProp = false, prop = 'block') => {
    if (elem) {
      if (removeProp) {
        elem.style.removeProperty('display');
      } else {
        elem.style.display = prop;
      }
    }
  };

  const hideElement = (elem) => {
    if (elem) {
      elem.style.display = 'none';
    }
  };

  const selectors$9 = {
    headerSticky: '[data-header-sticky]',
    headerHeight: '[data-header-height]',
  };

  const scrollTo = (elementTop) => {
    /* Sticky header check */
    const headerHeight =
      document.querySelector(selectors$9.headerSticky) && document.querySelector(selectors$9.headerHeight) ? document.querySelector(selectors$9.headerHeight).getBoundingClientRect().height : 0;

    window.scrollTo({
      top: elementTop + window.scrollY - headerHeight,
      left: 0,
      behavior: 'smooth',
    });
  };

  function Listeners() {
    this.entries = [];
  }

  Listeners.prototype.add = function (element, event, fn) {
    this.entries.push({element: element, event: event, fn: fn});
    element.addEventListener(event, fn);
  };

  Listeners.prototype.removeAll = function () {
    this.entries = this.entries.filter(function (listener) {
      listener.element.removeEventListener(listener.event, listener.fn);
      return false;
    });
  };

  /**
   * Find a match in the project JSON (using a ID number) and return the variant (as an Object)
   * @param {Object} product Product JSON object
   * @param {Number} value Accepts Number (e.g. 6908023078973)
   * @returns {Object} The variant object once a match has been successful. Otherwise null will be return
   */

  /**
   * Convert the Object (with 'name' and 'value' keys) into an Array of values, then find a match & return the variant (as an Object)
   * @param {Object} product Product JSON object
   * @param {Object} collection Object with 'name' and 'value' keys (e.g. [{ name: "Size", value: "36" }, { name: "Color", value: "Black" }])
   * @returns {Object || null} The variant object once a match has been successful. Otherwise null will be returned
   */
  function getVariantFromSerializedArray(product, collection) {
    _validateProductStructure(product);

    // If value is an array of options
    var optionArray = _createOptionArrayFromOptionCollection(product, collection);
    return getVariantFromOptionArray(product, optionArray);
  }

  /**
   * Find a match in the project JSON (using Array with option values) and return the variant (as an Object)
   * @param {Object} product Product JSON object
   * @param {Array} options List of submitted values (e.g. ['36', 'Black'])
   * @returns {Object || null} The variant object once a match has been successful. Otherwise null will be returned
   */
  function getVariantFromOptionArray(product, options) {
    _validateProductStructure(product);
    _validateOptionsArray(options);

    var result = product.variants.filter(function (variant) {
      return options.every(function (option, index) {
        return variant.options[index] === option;
      });
    });

    return result[0] || null;
  }

  /**
   * Creates an array of selected options from the object
   * Loops through the project.options and check if the "option name" exist (product.options.name) and matches the target
   * @param {Object} product Product JSON object
   * @param {Array} collection Array of object (e.g. [{ name: "Size", value: "36" }, { name: "Color", value: "Black" }])
   * @returns {Array} The result of the matched values. (e.g. ['36', 'Black'])
   */
  function _createOptionArrayFromOptionCollection(product, collection) {
    _validateProductStructure(product);
    _validateSerializedArray(collection);

    var optionArray = [];

    collection.forEach(function (option) {
      for (var i = 0; i < product.options.length; i++) {
        var name = product.options[i].name || product.options[i];
        if (name.toLowerCase() === option.name.toLowerCase()) {
          optionArray[i] = option.value;
          break;
        }
      }
    });

    return optionArray;
  }

  /**
   * Check if the product data is a valid JS object
   * Error will be thrown if type is invalid
   * @param {object} product Product JSON object
   */
  function _validateProductStructure(product) {
    if (typeof product !== 'object') {
      throw new TypeError(product + ' is not an object.');
    }

    if (Object.keys(product).length === 0 && product.constructor === Object) {
      throw new Error(product + ' is empty.');
    }
  }

  /**
   * Validate the structure of the array
   * It must be formatted like jQuery's serializeArray()
   * @param {Array} collection Array of object [{ name: "Size", value: "36" }, { name: "Color", value: "Black" }]
   */
  function _validateSerializedArray(collection) {
    if (!Array.isArray(collection)) {
      throw new TypeError(collection + ' is not an array.');
    }

    if (collection.length === 0) {
      throw new Error(collection + ' is empty.');
    }

    if (collection[0].hasOwnProperty('name')) {
      if (typeof collection[0].name !== 'string') {
        throw new TypeError('Invalid value type passed for name of option ' + collection[0].name + '. Value should be string.');
      }
    } else {
      throw new Error(collection[0] + 'does not contain name key.');
    }
  }

  /**
   * Validate the structure of the array
   * It must be formatted as list of values
   * @param {Array} collection Array of object (e.g. ['36', 'Black'])
   */
  function _validateOptionsArray(options) {
    if (Array.isArray(options) && typeof options[0] === 'object') {
      throw new Error(options + 'is not a valid array of options.');
    }
  }

  var selectors$a = {
    idInput: '[name="id"]',
    planInput: '[name="selling_plan"]',
    optionInput: '[name^="options"]',
    quantityInput: '[name="quantity"]',
    propertyInput: '[name^="properties"]',
  };

  // Public Methods
  // -----------------------------------------------------------------------------

  /**
   * Returns a URL with a variant ID query parameter. Useful for updating window.history
   * with a new URL based on the currently select product variant.
   * @param {string} url - The URL you wish to append the variant ID to
   * @param {number} id  - The variant ID you wish to append to the URL
   * @returns {string} - The new url which includes the variant ID query parameter
   */

  function getUrlWithVariant(url, id) {
    if (/variant=/.test(url)) {
      return url.replace(/(variant=)[^&]+/, '$1' + id);
    } else if (/\?/.test(url)) {
      return url.concat('&variant=').concat(id);
    }

    return url.concat('?variant=').concat(id);
  }

  /**
   * Constructor class that creates a new instance of a product form controller.
   *
   * @param {Element} element - DOM element which is equal to the <form> node wrapping product form inputs
   * @param {Object} product - A product object
   * @param {Object} options - Optional options object
   * @param {Function} options.onOptionChange - Callback for whenever an option input changes
   * @param {Function} options.onPlanChange - Callback for changes to name=selling_plan
   * @param {Function} options.onQuantityChange - Callback for whenever an quantity input changes
   * @param {Function} options.onPropertyChange - Callback for whenever a property input changes
   * @param {Function} options.onFormSubmit - Callback for whenever the product form is submitted
   */
  class ProductForm {
    constructor(element, product, options) {
      this.element = element;
      this.form = this.element.tagName == 'FORM' ? this.element : this.element.querySelector('form');
      this.product = this._validateProductObject(product);
      this.variantElement = this.element.querySelector(selectors$a.idInput);

      options = options || {};

      this._listeners = new Listeners();
      this._listeners.add(this.element, 'submit', this._onSubmit.bind(this, options));

      this.optionInputs = this._initInputs(selectors$a.optionInput, options.onOptionChange);

      this.planInputs = this._initInputs(selectors$a.planInput, options.onPlanChange);

      this.quantityInputs = this._initInputs(selectors$a.quantityInput, options.onQuantityChange);

      this.propertyInputs = this._initInputs(selectors$a.propertyInput, options.onPropertyChange);
    }

    /**
     * Cleans up all event handlers that were assigned when the Product Form was constructed.
     * Useful for use when a section needs to be reloaded in the theme editor.
     */
    destroy() {
      this._listeners.removeAll();
    }

    /**
     * Getter method which returns the array of currently selected option values
     *
     * @returns {Array} An array of option values
     */
    options() {
      return this._serializeInputValues(this.optionInputs, function (item) {
        var regex = /(?:^(options\[))(.*?)(?:\])/;
        item.name = regex.exec(item.name)[2]; // Use just the value between 'options[' and ']'
        return item;
      });
    }

    /**
     * Getter method which returns the currently selected variant, or `null` if variant
     * doesn't exist.
     *
     * @returns {Object|null} Variant object
     */
    variant() {
      const opts = this.options();
      if (opts.length) {
        return getVariantFromSerializedArray(this.product, opts);
      } else {
        return this.product.variants[0];
      }
    }

    /**
     * Getter method which returns the current selling plan, or `null` if plan
     * doesn't exist.
     *
     * @returns {Object|null} Variant object
     */
    plan(variant) {
      let plan = {
        allocation: null,
        group: null,
        detail: null,
      };
      const formData = new FormData(this.form);
      const id = formData.get('selling_plan');

      if (id && variant) {
        plan.allocation = variant.selling_plan_allocations.find(function (item) {
          return item.selling_plan_id.toString() === id.toString();
        });
      }
      if (plan.allocation) {
        plan.group = this.product.selling_plan_groups.find(function (item) {
          return item.id.toString() === plan.allocation.selling_plan_group_id.toString();
        });
      }
      if (plan.group) {
        plan.detail = plan.group.selling_plans.find(function (item) {
          return item.id.toString() === id.toString();
        });
      }

      if (plan && plan.allocation && plan.detail && plan.allocation) {
        return plan;
      } else return null;
    }

    /**
     * Getter method which returns a collection of objects containing name and values
     * of property inputs
     *
     * @returns {Array} Collection of objects with name and value keys
     */
    properties() {
      return this._serializeInputValues(this.propertyInputs, function (item) {
        var regex = /(?:^(properties\[))(.*?)(?:\])/;
        item.name = regex.exec(item.name)[2]; // Use just the value between 'properties[' and ']'
        return item;
      });
    }

    /**
     * Getter method which returns the current quantity or 1 if no quantity input is
     * included in the form
     *
     * @returns {Array} Collection of objects with name and value keys
     */
    quantity() {
      return this.quantityInputs[0] ? Number.parseInt(this.quantityInputs[0].value, 10) : 1;
    }

    getFormState() {
      const variant = this.variant();
      return {
        options: this.options(),
        variant: variant,
        properties: this.properties(),
        quantity: this.quantity(),
        plan: this.plan(variant),
      };
    }

    // Private Methods
    // -----------------------------------------------------------------------------
    _setIdInputValue(variant) {
      if (variant && variant.id) {
        this.variantElement.value = variant.id.toString();
      } else {
        this.variantElement.value = '';
      }

      this.variantElement.dispatchEvent(new Event('change'));
    }

    _onSubmit(options, event) {
      event.dataset = this.getFormState();
      if (options.onFormSubmit) {
        options.onFormSubmit(event);
      }
    }

    _onOptionChange(event) {
      this._setIdInputValue(event.dataset.variant);
    }

    _onFormEvent(cb) {
      if (typeof cb === 'undefined') {
        return Function.prototype.bind();
      }

      return function (event) {
        event.dataset = this.getFormState();
        this._setIdInputValue(event.dataset.variant);
        cb(event);
      }.bind(this);
    }

    _initInputs(selector, cb) {
      var elements = Array.prototype.slice.call(this.element.querySelectorAll(selector));

      return elements.map(
        function (element) {
          this._listeners.add(element, 'change', this._onFormEvent(cb));
          return element;
        }.bind(this)
      );
    }

    _serializeInputValues(inputs, transform) {
      return inputs.reduce(function (options, input) {
        if (
          input.checked || // If input is a checked (means type radio or checkbox)
          (input.type !== 'radio' && input.type !== 'checkbox') // Or if its any other type of input
        ) {
          options.push(transform({name: input.name, value: input.value}));
        }

        return options;
      }, []);
    }

    _validateProductObject(product) {
      if (typeof product !== 'object') {
        throw new TypeError(product + ' is not an object.');
      }

      if (typeof product.variants[0].options === 'undefined') {
        throw new TypeError('Product object is invalid. Make sure you use the product object that is output from {{ product | json }} or from the http://[your-product-url].js route');
      }
      return product;
    }
  }

  const selectors$b = {
    list: '[data-store-availability-list]',
  };

  const defaults = {
    close: '.js-modal-close',
    open: '.js-modal-open-store-availability-modal',
    openClass: 'modal--is-active',
    openBodyClass: 'modal--is-visible',
    closeModalOnClick: false,
    scrollIntoView: false,
  };

  class Modals {
    constructor(id, options) {
      this.modal = document.getElementById(id);

      if (!this.modal) return false;

      this.nodes = {
        parents: [document.querySelector('html'), document.body],
      };
      this.config = Object.assign(defaults, options);
      this.modalIsOpen = false;
      this.focusOnOpen = this.config.focusOnOpen ? document.getElementById(this.config.focusOnOpen) : this.modal;
      this.openElement = document.querySelector(this.config.open);
      this.a11y = a11y;

      this.init();
    }

    init() {
      this.openElement.addEventListener('click', this.open.bind(this));
      this.modal.querySelector(this.config.close).addEventListener('click', this.closeModal.bind(this));
    }

    open(evt) {
      // Keep track if modal was opened from a click, or called by another function
      let externalCall = false;
      // Prevent following href if link is clicked
      if (evt) {
        evt.preventDefault();
      } else {
        externalCall = true;
      }

      if (this.modalIsOpen && !externalCall) {
        this.closeModal();
        return;
      }

      this.modal.classList.add(this.config.openClass);
      this.nodes.parents.forEach((node) => {
        node.classList.add(this.config.openBodyClass);
      });
      this.modalIsOpen = true;

      const scrollableElement = document.querySelector(selectors$b.list);
      document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: scrollableElement}));

      if (this.config.scrollIntoView) {
        this.scrollIntoView();
      }
      this.bindEvents();

      this.a11y.trapFocus({
        container: this.modal,
      });
    }

    closeModal() {
      if (!this.modalIsOpen) return;
      document.activeElement.blur();
      this.modal.classList.remove(this.config.openClass);
      var self = this;
      this.nodes.parents.forEach(function (node) {
        node.classList.remove(self.config.openBodyClass);
      });
      this.modalIsOpen = false;
      this.openElement.focus();
      this.unbindEvents();

      this.a11y.removeTrapFocus({
        container: this.modal,
      });

      // Enable page scroll right after the closing animation ends
      const timeout = 400;
      document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true, detail: timeout}));
    }

    bindEvents() {
      this.keyupHandler = this.keyupHandler.bind(this);
      this.clickHandler = this.clickHandler.bind(this);
      document.body.addEventListener('keyup', this.keyupHandler);
      document.body.addEventListener('click', this.clickHandler);
    }

    unbindEvents() {
      document.body.removeEventListener('keyup', this.keyupHandler);
      document.body.removeEventListener('click', this.clickHandler);
    }

    keyupHandler(event) {
      if (event.keyCode === theme.keyboardKeys.ESCAPE) {
        this.closeModal();
      }
    }

    clickHandler(event) {
      if (this.config.closeModalOnClick && !this.modal.contains(event.target) && !event.target.matches(this.config.open)) {
        this.closeModal();
      }
    }

    scrollIntoView() {
      this.focusOnOpen.scrollIntoView({
        behavior: 'smooth',
      });
    }
  }

  const selectors$c = {
    body: 'body',
    storeAvailabilityModal: '[data-store-availability-modal]',
    storeAvailabilityModalOpen: '[data-store-availability-modal-open]',
    storeAvailabilityModalClose: '[data-store-availability-modal-close]',
    storeAvailabilityModalProductTitle: '[data-store-availability-modal-product__title]',
  };

  const classes$9 = {
    openClass: 'store-availabilities-modal--active',
  };

  class StoreAvailability {
    constructor(container) {
      this.container = container;
    }

    updateContent(variantId, productTitle) {
      this._fetchStoreAvailabilities(variantId, productTitle);
    }

    clearContent() {
      this.container.innerHTML = '';
    }

    _initModal() {
      return new Modals('StoreAvailabilityModal', {
        close: selectors$c.storeAvailabilityModalClose,
        open: selectors$c.storeAvailabilityModalOpen,
        closeModalOnClick: true,
        openClass: classes$9.openClass,
        scrollIntoView: false,
      });
    }

    _fetchStoreAvailabilities(variantId, productTitle) {
      const variantSectionUrl = '/variants/' + variantId + '/?section_id=store-availability';
      this.clearContent();

      const self = this;
      fetch(variantSectionUrl)
        .then(function (response) {
          return response.text();
        })
        .then(function (storeAvailabilityHTML) {
          const body = document.querySelector(selectors$c.body);
          let storeAvailabilityModal = body.querySelector(selectors$c.storeAvailabilityModal);
          if (storeAvailabilityModal) {
            storeAvailabilityModal.remove();
          }

          self.container.innerHTML = storeAvailabilityHTML;
          self.container.innerHTML = self.container.firstElementChild.innerHTML;

          if (self.container.firstElementChild.innerHTML.trim() === '') {
            self.clearContent();
            return;
          }

          const storeAvailabilityModalOpen = self.container.querySelector(selectors$c.storeAvailabilityModalOpen);
          // Only create modal if open modal element exists
          if (!storeAvailabilityModalOpen) {
            return;
          }

          self.modal = self._initModal();
          self._updateProductTitle(productTitle);

          storeAvailabilityModal = self.container.querySelector(selectors$c.storeAvailabilityModal);
          if (storeAvailabilityModal) {
            body.appendChild(storeAvailabilityModal);
          }
        });
    }

    _updateProductTitle(productTitle) {
      const storeAvailabilityModalProductTitle = this.container.querySelector(selectors$c.storeAvailabilityModalProductTitle);
      storeAvailabilityModalProductTitle.textContent = productTitle;
    }
  }

  /**
   * Variant Sellout Precrime Click Preview
   * I think of this like the precrime machine in Minority report.  It gives a preview
   * of every possible click action, given the current form state.  The logic is:
   *
   * for each clickable name=options[] variant selection element
   * find the value of the form if the element were clicked
   * lookup the variant with those value in the product json
   * clear the classes, add .unavailable if it's not found,
   * and add .sold-out if it is out of stock
   *
   * Caveat: we rely on the option position so we don't need
   * to keep a complex map of keys and values.
   */

  const selectors$d = {
    form: '[data-product-form]',
    optionPosition: '[data-option-position]',
    optionInput: '[name^="options"], [data-popout-option]',
  };

  const classes$a = {
    soldOut: 'sold-out',
    unavailable: 'unavailable',
  };

  const attributes$5 = {
    optionPosition: 'data-option-position',
    selectOptionValue: 'data-value',
  };

  class SelloutVariants {
    constructor(container, productJSON) {
      this.container = container;
      this.productJSON = productJSON;
      this.form = this.container.querySelector(selectors$d.form);
      this.formData = new FormData(this.form);
      this.optionElements = this.container.querySelectorAll(selectors$d.optionInput);

      if (this.productJSON && this.form) {
        this.init();
      }
    }

    init() {
      this.update();
    }

    update() {
      this.getCurrentState();

      this.optionElements.forEach((el) => {
        const val = el.value || el.getAttribute(attributes$5.selectOptionValue);
        const optionSelector = el.closest(selectors$d.optionPosition);

        if (!optionSelector) {
          return;
        }

        const positionString = optionSelector.getAttribute(attributes$5.optionPosition);
        // subtract one because option.position in liquid does not count form zero, but JS arrays do
        const position = parseInt(positionString, 10) - 1;

        let newVals = [...this.selections];
        newVals[position] = val;

        const found = this.productJSON.variants.find((element) => {
          // only return true if every option matches our hypothetical selection
          let perfectMatch = true;
          for (let index = 0; index < newVals.length; index++) {
            if (element.options[index] !== newVals[index]) {
              perfectMatch = false;
            }
          }
          return perfectMatch;
        });

        el.parentElement.classList.remove(classes$a.soldOut, classes$a.unavailable);
        if (typeof found === 'undefined') {
          el.parentElement.classList.add(classes$a.unavailable);
        } else if (found?.available === false) {
          el.parentElement.classList.add(classes$a.soldOut);
        }
      });
    }

    getCurrentState() {
      this.formData = new FormData(this.form);
      this.selections = [];
      for (var value of this.formData.entries()) {
        if (value[0].includes('options[')) {
          // push the current state of the form, dont worry about the group name
          // we will be using the array position instead of the name to match values
          this.selections.push(value[1]);
        }
      }
    }
  }

  /*
  Usage:
    import {NotificationPopup} from '../features/notification-popup';

    if (button.hasAttribute(attributes.notificationPopup) {
      new NotificationPopup(button);
    }

  */

  const settings$1 = {
    templateIndex: 1,
  };

  const classes$b = {
    popupNotification: 'pswp--notification pswp--not-close-btn',
  };

  const attributes$6 = {
    notificationPopup: 'data-notification-popup',
  };

  const options = {
    history: false,
    focus: false,
    mainClass: classes$b.popupNotification,
    closeOnVerticalDrag: false,
  };

  class NotificationPopup {
    constructor(button) {
      this.button = button;
      this.a11y = a11y;
      this.notificationPopupHtml = this.button.getAttribute(attributes$6.notificationPopup);

      if (this.notificationPopupHtml.trim() !== '') {
        this.init();
      }
    }

    init() {
      const items = [
        {
          html: this.notificationPopupHtml,
        },
      ];

      this.a11y.state.trigger = this.button;

      new LoadPhotoswipe(items, options, settings$1.templateIndex);
    }
  }

  const selectors$e = {
    product: '[data-product]',
    productForm: '[data-product-form]',
    addToCart: '[data-add-to-cart]',
    addToCartText: '[data-add-to-cart-text]',
    buyItNow: '[data-buy-it-now]',
    comparePrice: '[data-compare-price]',
    formWrapper: '[data-form-wrapper]',
    header: '[data-site-header]',
    originalSelectorId: '[data-product-select]',
    preOrderTag: '_preorder',
    priceWrapper: '[data-price-wrapper]',
    priceOffWrap: '[data-price-off]',
    priceOffType: '[data-price-off-type]',
    priceOffAmount: '[data-price-off-amount]',
    productSlide: '[data-product-slide]',
    productImage: '[data-product-image]',
    productMediaSlider: '[data-product-single-media-slider]',
    productJson: '[data-product-json]',
    productPrice: '[data-product-price]',
    unitPrice: '[data-product-unit-price]',
    unitBase: '[data-product-base]',
    unitWrapper: '[data-product-unit]',
    subPrices: '[data-subscription-watch-price]',
    subSelectors: '[data-subscription-selectors]',
    subsToggle: '[data-toggles-group]',
    subsChild: 'data-group-toggle',
    subDescription: '[data-plan-description]',
    remainingCount: '[data-remaining-count]',
    remainingWrapper: '[data-remaining-wrapper]',
    remainingJSON: '[data-product-remaining-json]',
    idInput: '[name="id"]',
    storeAvailabilityContainer: '[data-store-availability-container]',
    upsellButton: '[data-upsell-btn]',
    sectionNode: '.shopify-section',
    quickViewItem: '[data-quick-view-item]',
  };

  const classes$c = {
    hidden: 'hidden',
    variantSoldOut: 'variant--soldout',
    variantUnavailable: 'variant--unavailabe',
    productPriceSale: 'product__price--sale',
    priceWrapperHidden: 'product__price--hidden',
    remainingLow: 'count-is-low',
    remainingIn: 'count-is-in',
    remainingOut: 'count-is-out',
    remainingUnavailable: 'count-is-unavailable',
  };

  const attributes$7 = {
    productImageId: 'data-image-id',
    tallLayout: 'data-tall-layout',
    dataEnableHistoryState: 'data-enable-history-state',
    notificationPopup: 'data-notification-popup',
  };

  class ProductAddForm {
    constructor(container) {
      this.container = container;
      this.product = this.container.querySelector(selectors$e.product);
      this.productForm = this.container.querySelector(selectors$e.productForm);
      this.tallLayout = this.container.getAttribute(attributes$7.tallLayout) === 'true';

      // Stop parsing if we don't have the product
      if (!this.product || !this.productForm) {
        const counter = new QuantityCounter(this.container);
        counter.init();
        return;
      }

      this.storeAvailabilityContainer = this.container.querySelector(selectors$e.storeAvailabilityContainer);
      this.enableHistoryState = this.container.getAttribute(attributes$7.dataEnableHistoryState) === 'true';
      this.hasUnitPricing = this.container.querySelector(selectors$e.unitWrapper);
      this.subSelectors = this.container.querySelector(selectors$e.subSelectors);
      this.subPrices = this.container.querySelector(selectors$e.subPrices);

      this.priceOffWrap = this.container.querySelector(selectors$e.priceOffWrap);
      this.priceOffAmount = this.container.querySelector(selectors$e.priceOffAmount);
      this.priceOffType = this.container.querySelector(selectors$e.priceOffType);
      this.planDecription = this.container.querySelector(selectors$e.subDescription);
      this.latestVariantId = '';
      this.latestVariantTitle = '';
      this.sellout = null;

      this.sessionStorage = window.sessionStorage;

      this.remainingWrapper = this.container.querySelector(selectors$e.remainingWrapper);

      if (this.remainingWrapper) {
        this.remainingMaxInt = parseInt(this.remainingWrapper.dataset.remainingMax, 10);
        this.remainingCount = this.container.querySelector(selectors$e.remainingCount);
        this.remainingJSONWrapper = this.container.querySelector(selectors$e.remainingJSON);
        this.remainingJSON = null;

        if (this.remainingJSONWrapper && this.remainingJSONWrapper.innerHTML !== '') {
          this.remainingJSON = JSON.parse(this.remainingJSONWrapper.innerHTML);
        }
      }

      if (this.storeAvailabilityContainer) {
        this.storeAvailability = new StoreAvailability(this.storeAvailabilityContainer);
      }

      const counter = new QuantityCounter(this.container);
      counter.init();

      this.init();
    }

    init() {
      let productJSON = null;
      const productElemJSON = this.container.querySelector(selectors$e.productJson);

      if (productElemJSON) {
        productJSON = productElemJSON.innerHTML;
      }
      if (productJSON) {
        this.productJSON = JSON.parse(productJSON);
        this.linkForm();
        this.sellout = new SelloutVariants(this.container, this.productJSON);
      } else {
        console.error('Missing product JSON');
      }
    }

    destroy() {
      this.productForm.destroy();
    }

    linkForm() {
      this.productForm = new ProductForm(this.productForm, this.productJSON, {
        onOptionChange: this.onOptionChange.bind(this),
        onPlanChange: this.onPlanChange.bind(this),
      });
      this.pushState(this.productForm.getFormState());
      this.subsToggleListeners();
    }

    onOptionChange(evt) {
      this.pushState(evt.dataset);
      this.updateProductImage(evt);
    }

    onPlanChange(evt) {
      if (this.subPrices) {
        this.pushState(evt.dataset);
      }
    }

    pushState(formState) {
      this.productState = this.setProductState(formState);
      this.updateAddToCartState(formState);
      this.updateProductPrices(formState);
      this.updateSaleText(formState);
      this.updateSubscriptionText(formState);
      this.fireHookEvent(formState);
      this.updateRemaining(formState);
      this.sellout?.update(formState);
      if (this.enableHistoryState) {
        this.updateHistoryState(formState);
      }

      if (this.storeAvailability) {
        if (formState.variant) {
          this.storeAvailability.updateContent(formState.variant.id, this.productForm.product.title);
        } else {
          this.storeAvailability.clearContent();
        }
      }
    }

    updateAddToCartState(formState) {
      const variant = formState.variant;
      const priceWrapper = this.container.querySelectorAll(selectors$e.priceWrapper);
      const addToCart = this.container.querySelectorAll(selectors$e.addToCart);
      const addToCartText = this.container.querySelectorAll(selectors$e.addToCartText);
      const formWrapper = this.container.querySelectorAll(selectors$e.formWrapper);
      const buyItNow = this.container.querySelector(selectors$e.buyItNow);
      let addText = theme.strings.add_to_cart;

      if (this.productJSON.tags.includes(selectors$e.preOrderTag)) {
        addText = theme.strings.preorder;
      }

      if (priceWrapper.length) {
        priceWrapper.forEach((element) => {
          if (variant) {
            element.classList.remove(classes$c.priceWrapperHidden);
          } else {
            element.classList.add(classes$c.priceWrapperHidden);
          }
        });
      }

      if (addToCart.length) {
        addToCart.forEach((element) => {
          // Skip the upsell "add to cart" button
          if (element.matches(selectors$e.upsellButton)) {
            return;
          }

          element.disabled = true;

          if (buyItNow) {
            buyItNow.classList.add(classes$c.hidden);
          }

          if (variant) {
            element.disabled = false;

            if (variant.available) {
              if (buyItNow) {
                buyItNow.classList.remove(classes$c.hidden);
              }
            }

            if (element.hasAttribute(attributes$7.notificationPopup)) {
              const notificationFormId = element.id.replace('AddToCart', 'NotificationForm');
              const formID = this.sessionStorage.getItem('notification_form_id');
              let notificationFormSubmitted = false;
              let variantId = variant.id;
              let variantTitle = variant.title;

              if (formID) {
                const sessionId = formID.substring(0, formID.lastIndexOf('--'));
                const sessionVariantId = formID.split('--').slice(-1)[0];
                notificationFormSubmitted = notificationFormId === sessionId;

                if (notificationFormSubmitted) {
                  this.latestVariantId = variantId;
                  this.latestVariantTitle = variantTitle;
                  variantId = Number(sessionVariantId);

                  this.productJSON.variants.forEach((variant) => {
                    if (variant.id === variantId) {
                      variantTitle = variant.title;
                    }
                  });
                }
              }

              let notificationPopupHtml = element.getAttribute(attributes$7.notificationPopup);

              if (this.latestVariantId != '' && this.latestVariantTitle != '') {
                notificationPopupHtml = notificationPopupHtml.replaceAll(this.latestVariantId, variantId);
                notificationPopupHtml = notificationPopupHtml.replaceAll(this.latestVariantTitle, variantTitle);
              }

              element.setAttribute(attributes$7.notificationPopup, notificationPopupHtml);

              if (notificationFormSubmitted) {
                this.scrollToForm(this.product.closest(selectors$e.sectionNode));
                new NotificationPopup(element);
              }

              this.latestVariantId = variantId;
              this.latestVariantTitle = variantTitle;
            }
          }
        });
      }

      if (addToCartText.length) {
        addToCartText.forEach((element) => {
          if (variant) {
            if (variant.available) {
              element.innerHTML = addText;
            } else {
              element.innerHTML = theme.strings.sold_out;

              if (element.parentNode.hasAttribute(attributes$7.notificationPopup)) {
                if (element.closest(selectors$e.quickViewItem)) return; // Disable 'notify me' text change for Quickview

                element.innerHTML = `${theme.strings.sold_out} - ${theme.strings.newsletter_product_availability}`;
              }
            }
          } else {
            element.innerHTML = theme.strings.unavailable;
          }
        });
      }

      if (formWrapper.length) {
        formWrapper.forEach((element) => {
          if (variant) {
            if (variant.available) {
              element.classList.remove(classes$c.variantSoldOut, classes$c.variantUnavailable);
            } else {
              element.classList.add(classes$c.variantSoldOut);
              element.classList.remove(classes$c.variantUnavailable);
            }
            const formSelect = element.querySelector(selectors$e.originalSelectorId);
            if (formSelect) {
              formSelect.value = variant.id;
            }
          } else {
            element.classList.add(classes$c.variantUnavailable);
            element.classList.remove(classes$c.variantSoldOut);
          }
        });
      }
    }

    updateHistoryState(formState) {
      const variant = formState.variant;
      const plan = formState.plan;
      const location = window.location.href;
      if (variant && location.includes('/product')) {
        const url = new window.URL(location);
        const params = url.searchParams;
        params.set('variant', variant.id);
        if (plan && plan.detail && plan.detail.id && this.productState.hasPlan) {
          params.set('selling_plan', plan.detail.id);
        } else {
          params.delete('selling_plan');
        }
        url.search = params.toString();
        const urlString = url.toString();
        window.history.replaceState({path: urlString}, '', urlString);
      }
    }

    updateRemaining(formState) {
      const variant = formState.variant;
      const remainingClasses = [classes$c.remainingIn, classes$c.remainingOut, classes$c.remainingUnavailable, classes$c.remainingLow];

      if (variant && this.remainingWrapper && this.remainingJSON) {
        const remaining = this.remainingJSON[variant.id];

        if (remaining === 'out' || remaining < 1) {
          this.remainingWrapper.classList.remove(...remainingClasses);
          this.remainingWrapper.classList.add(classes$c.remainingOut);
        }

        if (remaining === 'in' || remaining >= this.remainingMaxInt) {
          this.remainingWrapper.classList.remove(...remainingClasses);
          this.remainingWrapper.classList.add(classes$c.remainingIn);
        }

        if (remaining === 'low' || (remaining > 0 && remaining < this.remainingMaxInt)) {
          this.remainingWrapper.classList.remove(...remainingClasses);
          this.remainingWrapper.classList.add(classes$c.remainingLow);

          if (this.remainingCount) {
            this.remainingCount.innerHTML = remaining;
          }
        }
      } else if (!variant && this.remainingWrapper) {
        this.remainingWrapper.classList.remove(...remainingClasses);
        this.remainingWrapper.classList.add(classes$c.remainingUnavailable);
      }
    }

    getBaseUnit(variant) {
      return variant.unit_price_measurement.reference_value === 1
        ? variant.unit_price_measurement.reference_unit
        : variant.unit_price_measurement.reference_value + variant.unit_price_measurement.reference_unit;
    }

    subsToggleListeners() {
      const toggles = this.container.querySelectorAll(selectors$e.subsToggle);

      toggles.forEach((toggle) => {
        toggle.addEventListener(
          'change',
          function (e) {
            const val = e.target.value.toString();
            const selected = this.container.querySelector(`[${selectors$e.subsChild}="${val}"]`);
            const groups = this.container.querySelectorAll(`[${selectors$e.subsChild}]`);
            if (selected) {
              selected.classList.remove(classes$c.hidden);
              const first = selected.querySelector('[name="selling_plan"]');
              first.checked = true;
              first.dispatchEvent(new Event('change'));
            }
            groups.forEach((group) => {
              if (group !== selected) {
                group.classList.add(classes$c.hidden);
                const plans = group.querySelectorAll('[name="selling_plan"]');
                plans.forEach((plan) => {
                  plan.checked = false;
                  plan.dispatchEvent(new Event('change'));
                });
              }
            });
          }.bind(this)
        );
      });
    }

    updateSaleText(formState) {
      if (this.productState.planSale) {
        this.updateSaleTextSubscription(formState);
      } else if (this.productState.onSale) {
        this.updateSaleTextStandard(formState);
      } else if (this.priceOffWrap) {
        this.priceOffWrap.classList.add(classes$c.hidden);
      }
    }

    updateSaleTextStandard(formState) {
      if (!this.priceOffType) {
        return;
      }
      this.priceOffType.innerHTML = window.theme.strings.sale_badge_text || 'sale';
      const variant = formState.variant;
      if (window.theme.settings.savingBadgeType && window.theme.settings.savingBadgeType === 'percentage') {
        const discountFloat = (variant.compare_at_price - variant.price) / variant.compare_at_price;
        const discountInt = Math.floor(discountFloat * 100);
        this.priceOffAmount.innerHTML = `${discountInt}%`;
      } else {
        const discount = variant.compare_at_price - variant.price;
        this.priceOffAmount.innerHTML = themeCurrency.formatMoney(discount, theme.moneyFormat);
      }
      this.priceOffWrap.classList.remove(classes$c.hidden);
    }

    updateSaleTextSubscription(formState) {
      this.priceOffType.innerHTML = window.theme.strings.subscription || 'subscripton';
      const variant = formState.variant;
      const adjustment = formState.plan.detail.price_adjustments[0];
      const discount = adjustment.value;
      if (adjustment && adjustment.value_type === 'percentage') {
        this.priceOffAmount.innerHTML = `${discount}%`;
      } else if (adjustment && adjustment.value_type === 'price') {
        this.priceOffAmount.innerHTML = themeCurrency.formatMoney(variant.price - adjustment.value, theme.moneyFormat);
      } else {
        this.priceOffAmount.innerHTML = themeCurrency.formatMoney(discount, theme.moneyFormat);
      }
      this.priceOffWrap.classList.remove(classes$c.hidden);
    }

    updateSubscriptionText(formState) {
      if (formState.plan && this.planDecription && formState.plan.detail.description !== null) {
        this.planDecription.innerHTML = formState.plan.detail.description;
        this.planDecription.classList.remove(classes$c.hidden);
      } else if (this.planDecription) {
        this.planDecription.classList.add(classes$c.hidden);
      }
    }

    updateProductPrices(formState) {
      const variant = formState.variant;
      const plan = formState.plan;
      const priceWrappers = this.container.querySelectorAll(selectors$e.priceWrapper);

      priceWrappers.forEach((wrap) => {
        const comparePriceEl = wrap.querySelector(selectors$e.comparePrice);
        const productPriceEl = wrap.querySelector(selectors$e.productPrice);

        let comparePrice = '';
        let price = '';

        if (this.productState.available) {
          comparePrice = variant.compare_at_price;
          price = variant.price;
        }

        if (this.productState.hasPlan) {
          price = plan.allocation.price;
        }

        if (this.productState.planSale) {
          comparePrice = plan.allocation.compare_at_price;
          price = plan.allocation.price;
        }

        if (comparePriceEl) {
          if (this.productState.onSale || this.productState.planSale) {
            comparePriceEl.classList.remove(classes$c.hidden);
            productPriceEl.classList.add(classes$c.productPriceSale);
          } else {
            comparePriceEl.classList.add(classes$c.hidden);
            productPriceEl.classList.remove(classes$c.productPriceSale);
          }
          comparePriceEl.innerHTML = theme.settings.currency_code_enable ? themeCurrency.formatMoney(comparePrice, theme.moneyWithCurrencyFormat) : themeCurrency.formatMoney(comparePrice, theme.moneyFormat);
        }

        if (price === 0) {
          productPriceEl.innerHTML = window.theme.strings.free;
        } else {
          productPriceEl.innerHTML = theme.settings.currency_code_enable ? themeCurrency.formatMoney(price, theme.moneyWithCurrencyFormat) : themeCurrency.formatMoney(price, theme.moneyFormat);
        }
      });

      if (this.hasUnitPricing) {
        this.updateProductUnits(formState);
      }
    }

    updateProductUnits(formState) {
      const variant = formState.variant;
      const plan = formState.plan;
      let unitPrice = null;

      if (variant && variant.unit_price) {
        unitPrice = variant.unit_price;
      }
      if (plan && plan.allocation && plan.allocation.unit_price) {
        unitPrice = plan.allocation.unit_price;
      }

      if (unitPrice) {
        const base = this.getBaseUnit(variant);
        const formattedPrice = unitPrice === 0 ? window.theme.strings.free : themeCurrency.formatMoney(unitPrice, theme.moneyFormat);
        this.container.querySelector(selectors$e.unitPrice).innerHTML = formattedPrice;
        this.container.querySelector(selectors$e.unitBase).innerHTML = base;
        showElement(this.container.querySelector(selectors$e.unitWrapper));
      } else {
        hideElement(this.container.querySelector(selectors$e.unitWrapper));
      }
    }

    fireHookEvent(formState) {
      const variant = formState.variant;

      // Hook for product variant change event
      this.container.dispatchEvent(
        new CustomEvent('theme:variant:change', {
          detail: {
            variant: variant,
          },
          bubbles: true,
        })
      );
    }

    /**
     * Tracks aspects of the product state that are relevant to UI updates
     * @param {object} evt - variant change event
     * @return {object} productState - represents state of variant + plans
     *  productState.available - current variant and selling plan options result in valid offer
     *  productState.soldOut - variant is sold out
     *  productState.onSale - variant is on sale
     *  productState.showUnitPrice - variant has unit price
     *  productState.requiresPlan - all the product variants requires a selling plan
     *  productState.hasPlan - there is a valid selling plan
     *  productState.planSale - plan has a discount to show next to price
     *  productState.planPerDelivery - plan price does not equal per_delivery_price - a prepaid subscribtion
     */
    setProductState(dataset) {
      const variant = dataset.variant;
      const plan = dataset.plan;

      const productState = {
        available: true,
        soldOut: false,
        onSale: false,
        showUnitPrice: false,
        requiresPlan: false,
        hasPlan: false,
        planPerDelivery: false,
        planSale: false,
      };

      if (!variant || (variant.requires_selling_plan && !plan)) {
        productState.available = false;
      } else {
        if (!variant.available) {
          productState.soldOut = true;
        }

        if (variant.compare_at_price > variant.price) {
          productState.onSale = true;
        }

        if (variant.unit_price) {
          productState.showUnitPrice = true;
        }

        if (this.product && this.product.requires_selling_plan) {
          productState.requiresPlan = true;
        }

        if (plan && this.subPrices) {
          productState.hasPlan = true;
          if (plan.allocation.per_delivery_price !== plan.allocation.price) {
            productState.planPerDelivery = true;
          }
          if (variant.price > plan.allocation.price) {
            productState.planSale = true;
          }
        }
      }
      return productState;
    }

    updateProductImage(evt) {
      const variant = evt.dataset.variant;

      if (!variant || !variant?.featured_media) {
        return;
      }

      // Update variant image, if one is set
      const newImg = this.container.querySelector(`${selectors$e.productImage}[${attributes$7.productImageId}="${variant.featured_media.id}"]`);
      const newImageParent = newImg?.closest(selectors$e.productSlide);

      if (newImageParent) {
        const newImagePos = parseInt([...newImageParent.parentElement.children].indexOf(newImageParent));
        const imgSlider = this.container.querySelector(selectors$e.productMediaSlider);
        const flkty = Flickity.data(imgSlider);

        // Activate image slide in mobile view
        if (flkty && flkty.isActive) {
          const variantSlide = imgSlider.querySelector(`[data-id="${variant.featured_media.id}"]`);

          if (variantSlide) {
            const slideIndex = parseInt([...variantSlide.parentNode.children].indexOf(variantSlide));
            flkty.select(slideIndex);
          }
          return;
        }

        if (this.tallLayout) {
          // We know its a tall layout, if it's sticky
          // scroll to the images
          // Scroll to/reorder image unless it's the first photo on load
          const newImgTop = newImg.getBoundingClientRect().top;

          if (newImagePos === 0 && newImgTop + window.scrollY > window.pageYOffset) return;

          // Scroll to variant image
          document.dispatchEvent(
            new CustomEvent('theme:tooltip:close', {
              bubbles: false,
              detail: {
                hideTransition: false,
              },
            })
          );

          scrollTo(newImgTop);
        }
      }
    }

    /**
     * Scroll to the last submitted notification form
     */
    scrollToForm(section) {
      const headerHeight = document.querySelector(selectors$e.header).dataset.height;
      const isVisible = visibilityHelper.isElementPartiallyVisible(section) || visibilityHelper.isElementTotallyVisible(section);

      if (!isVisible) {
        setTimeout(() => {
          const rect = section.getBoundingClientRect();
          const sectionTop = rect.top - headerHeight;

          window.scrollTo({
            top: sectionTop,
            left: 0,
            behavior: 'smooth',
          });
        }, 400);
      }
    }
  }

  const productFormSection = {
    onLoad() {
      this.section = new ProductAddForm(this.container);
    },
  };

  /**
   * Image Helper Functions
   * -----------------------------------------------------------------------------
   * https://github.com/Shopify/slate.git.
   *
   */

  /**
   * Adds a Shopify size attribute to a URL
   *
   * @param src
   * @param size
   * @returns {*}
   */
  function getSizedImageUrl(src, size) {
    if (size === null) {
      return src;
    }

    if (typeof src === 'undefined' || src === null) {
      src = window.theme.assets.noImage;
    }

    if (size === 'master') {
      return removeProtocol(src);
    }

    const match = src.match(/\.(jpg|jpeg|gif|png|bmp|bitmap|tiff|tif|webp)(\?v=\d+)?$/i);

    if (match) {
      const prefix = src.split(match[0]);
      const suffix = match[0];

      return removeProtocol(`${prefix[0]}_${size}${suffix}`);
    } else {
      return null;
    }
  }

  function removeProtocol(path) {
    return path.replace(/http(s)?:/, '');
  }

  function fetchProduct(handle) {
    const requestRoute = `${theme.routes.root}products/${handle}.js`;

    return window
      .fetch(requestRoute)
      .then((response) => {
        return response.json();
      })
      .catch((e) => {
        console.error(e);
      });
  }

  const defaults$1 = {
    color: 'ash',
  };

  const selectors$f = {
    swatch: '[data-swatch]',
    swatchColor: '[data-swatch-color]',
    template: '[data-swatch-template]',
    productBlock: '[data-product-block]',
    productImage: '[data-product-image]',
    productImageSecondary: '[data-product-image-secondary]',
    productImageHover: '[data-product-image-hover]',
    productId: '[data-product-id]',
    quickView: '[data-button-quick-view]',
    gridImage: '[data-grid-image]',
    link: '[data-grid-link]',
    loadHovers: '[data-load-hovers]',
  };

  const classes$d = {
    mediaVisible: 'product__media--featured-visible',
    mediaHoverVisible: 'product__media__hover-img--visible',
    noImage: 'swatch__link--no-image',
  };

  const attributes$8 = {
    swatch: 'data-swatch',
    handle: 'data-swatch-handle',
    label: 'data-swatch-label',
    image: 'data-swatch-image',
    imageId: 'data-swatch-image-id',
    variant: 'data-swatch-variant',
    index: 'data-swatch-index',
    productId: 'data-product-id',
    swatchVariant: 'data-swatch-variant',
    variandId: 'data-variant-id',
    href: 'href',
    bgSet: 'data-bgset',
    aspectRatio: 'data-aspectratio',
    dataFetchedImage: 'data-fetched-image',
    dataFetchedImageIndex: 'data-fetched-image-index',
    dataGridImageDefault: 'data-grid-image-default',
    dataGridImageTarget: 'data-grid-image-target',
    dataGridImageTargetDefault: 'data-grid-image-target-default',
  };

  let swatches = {};

  class ColorMatch {
    constructor(options = {}) {
      this.settings = {
        ...defaults$1,
        ...options,
      };

      this.match = this.init();
    }

    getColor() {
      return this.match;
    }

    init() {
      const getColors = loadScript({json: theme.assets.swatches});
      return getColors
        .then((colors) => {
          return this.matchColors(colors, this.settings.color);
        })
        .catch((e) => {
          console.log('failed to load swatch colors script');
          console.log(e);
        });
    }

    matchColors(colors, name) {
      let bg = '#E5E5E5';
      let img = null;
      const path = theme.assets.base || '/';
      const comparisonName = name.toLowerCase().replace(/\s/g, '');
      const array = colors.colors;

      if (array) {
        let indexArray = null;

        const hexColorArr = array.filter((colorObj, index) => {
          const neatName = Object.keys(colorObj).toString().toLowerCase().replace(/\s/g, '');

          if (neatName === comparisonName) {
            indexArray = index;

            return colorObj;
          }
        });

        if (hexColorArr.length && indexArray !== null) {
          const value = Object.values(array[indexArray])[0];
          bg = value;

          if (value.includes('.jpg') || value.includes('.jpeg') || value.includes('.png') || value.includes('.svg')) {
            img = `${path}${value}`;
            bg = '#888888';
          }
        }
      }

      return {
        color: this.settings.color,
        path: img,
        hex: bg,
      };
    }
  }

  class Swatch {
    constructor(element) {
      this.element = element;
      this.swatchLink = this.element.nextElementSibling;
      this.colorString = element.getAttribute(attributes$8.swatch);
      this.image = this.element.getAttribute(attributes$8.image);
      this.imageId = this.element.getAttribute(attributes$8.imageId);
      this.variant = this.element.getAttribute(attributes$8.variant);
      this.outer = this.element.closest(selectors$f.productBlock);
      this.gridImage = null;
      this.imageDefault = null;
      this.hoverImages = [];
      this.loadHovers = null;

      const matcher = new ColorMatch({color: this.colorString});
      matcher.getColor().then((result) => {
        this.colorMatch = result;
        this.init();
      });
    }

    init() {
      this.setStyles();

      if (this.variant && this.outer) {
        this.handleHovers();
        this.handleClicks();
      }

      if (!this.image && this.swatchLink) {
        this.swatchLink.classList.add(classes$d.noImage);
      }
    }

    setStyles() {
      if (this.colorMatch && this.colorMatch.hex) {
        this.element.style.setProperty('--swatch', `${this.colorMatch.hex}`);
      }

      if (this.colorMatch && this.colorMatch.path) {
        this.element.style.setProperty('background-image', `url(${this.colorMatch.path})`);
      }
    }

    handleHovers() {
      // Load images on PGI swatch hover
      this.swatchLink.addEventListener('mouseenter', () => {
        this.imageReplace = null;

        if (this.imageId) {
          const target = this.outer.querySelector(`[${attributes$8.dataGridImageTarget}="${this.imageId}"]`);
          if (!target) {
            this.gridImage = this.outer.querySelector(selectors$f.gridImage);

            if (this.image && this.gridImage) {
              // Container width rounded to the nearest 180 pixels
              // Increses likelihood that the image will be cached
              const ratio = window.devicePixelRatio || 1;
              const pixels = this.gridImage.offsetWidth * ratio;
              const widthRounded = Math.ceil(pixels / 180) * 180;
              const defaultImageId = this.gridImage.hasAttribute(attributes$8.dataGridImageTargetDefault) ? this.gridImage.getAttribute(attributes$8.dataGridImageTargetDefault) : '';
              if (defaultImageId === this.imageId && this.gridImage.hasAttribute(attributes$8.dataGridImageDefault)) {
                // Get default loaded image
                this.imageReplace = this.gridImage.getAttribute(attributes$8.dataGridImageDefault);
                return;
              }

              if (this.element.hasAttribute(attributes$8.dataFetchedImage)) {
                // Get already loaded image
                this.imageReplace = this.element.getAttribute(attributes$8.dataFetchedImage);
              } else {
                // Fetch new image
                const sizedImage = getSizedImageUrl(this.image, `${widthRounded}x`);

                window
                  .fetch(sizedImage)
                  .then((response) => {
                    return response.blob();
                  })
                  .then((blob) => {
                    const objectURL = URL.createObjectURL(blob);
                    this.imageReplace = `url("${objectURL}")`;
                    this.element.setAttribute(attributes$8.dataFetchedImage, this.imageReplace);

                    if (
                      this.element.hasAttribute(attributes$8.index) &&
                      this.outer.hasAttribute(attributes$8.dataFetchedImageIndex) &&
                      parseInt(this.element.getAttribute(attributes$8.index)) === parseInt(this.outer.getAttribute(attributes$8.dataFetchedImageIndex))
                    ) {
                      this.replaceImages();

                      this.outer.removeAttribute(attributes$8.dataFetchedImageIndex);
                    }
                  })
                  .catch((error) => {
                    console.log(`Error: ${error}`);
                  });
              }
            }
          }
        }

        this.loadHovers = this.outer.querySelector(selectors$f.loadHovers);

        if (this.loadHovers && !this.loadHovers?.hasAttribute('data-loaded')) {
          const content = document.createElement('div');
          content.appendChild(this.loadHovers.querySelector('template').content.firstElementChild.cloneNode(true));
          this.loadHovers.appendChild(content);
          this.loadHovers.setAttribute('data-loaded', true);
        }
      });
    }

    handleClicks() {
      // Change PGI featured image on swatch click
      this.swatchLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.updateImagesAndLinksOnEvent();
      });

      this.swatchLink.addEventListener('keyup', (e) => {
        if (e.which !== window.theme.keyboardKeys.ENTER) {
          return;
        }
        e.preventDefault();
        this.updateImagesAndLinksOnEvent();
      });
    }

    updateImagesAndLinksOnEvent() {
      this.updateLinks();
      this.replaceImages();
    }

    updateLinks() {
      this.linkElements = this.outer.querySelectorAll(selectors$f.link);
      this.quickView = this.outer.querySelector(selectors$f.quickView);

      // Update links
      if (this.linkElements.length) {
        this.linkElements.forEach((element) => {
          const destination = getUrlWithVariant(element.getAttribute('href'), this.variant);
          element.setAttribute('href', destination);
        });
      }

      // Change quickview variant with swatch one
      if (this.quickView && theme.settings.quickBuy === 'quick_buy') {
        this.quickView.setAttribute(attributes$8.variandId, this.variant);
      }
    }

    replaceImages() {
      this.imageSecondary = this.outer.querySelector(selectors$f.productImageSecondary);
      this.outer.removeAttribute(attributes$8.dataFetchedImageIndex);

      if (!this.imageReplace && this.element.hasAttribute(attributes$8.index)) {
        this.outer.setAttribute(attributes$8.dataFetchedImageIndex, parseInt(this.element.getAttribute(attributes$8.index)));
      }

      // Add new loaded image and sync with the secondary image for smooth animation
      if (this.imageReplace && this.gridImage && this.imageId) {
        this.gridImage.setAttribute(attributes$8.dataGridImageTarget, this.imageId);

        if (!this.gridImage.hasAttribute(attributes$8.dataGridImageDefault)) {
          this.gridImage.setAttribute(attributes$8.dataGridImageDefault, window.getComputedStyle(this.gridImage).backgroundImage);
        }

        const onAnimationEnd = () => {
          requestAnimationFrame(() => {
            this.gridImage.style.setProperty('background-image', this.imageReplace);

            requestAnimationFrame(() => {
              this.imageSecondary.classList.remove(classes$d.mediaVisible);
            });
          });

          this.imageSecondary.removeEventListener('animationend', onAnimationEnd);
        };

        requestAnimationFrame(() => {
          this.imageSecondary.classList.add(classes$d.mediaVisible);
          this.imageSecondary.style.setProperty('background-image', this.imageReplace);
        });

        this.imageSecondary.addEventListener('animationend', onAnimationEnd);
      }

      // Change all hover images classes
      if (theme.settings.productGridHover === 'image') {
        this.hoverImages = this.outer.querySelectorAll(selectors$f.productImageHover);
      }

      if (this.hoverImages.length > 1) {
        this.hoverImages.forEach((hoverImage) => {
          hoverImage.classList.remove(classes$d.mediaHoverVisible);

          if (hoverImage.getAttribute(attributes$8.variandId) === this.variant) {
            hoverImage.classList.add(classes$d.mediaHoverVisible);
          } else {
            this.hoverImages[0].classList.add(classes$d.mediaHoverVisible);
          }
        });
      }
    }
  }

  class GridSwatch extends HTMLElement {
    constructor() {
      super();

      this.handle = this.getAttribute(attributes$8.handle);
      this.label = this.getAttribute(attributes$8.label).trim().toLowerCase();

      fetchProduct(this.handle).then((product) => {
        this.product = product;
        this.colorOption = product.options.find((element) => {
          return element.name.toLowerCase() === this.label || null;
        });

        if (this.colorOption) {
          this.swatches = this.colorOption.values;
          this.init();
        }
      });
    }

    init() {
      this.swatchElements = this.querySelectorAll(selectors$f.swatch);

      this.swatchElements.forEach((el) => {
        new Swatch(el);
      });
    }
  }

  const makeSwatches = (container) => {
    swatches = [];
    const els = container.querySelectorAll(selectors$f.swatch);
    els.forEach((el) => {
      swatches.push(new Swatch(el));
    });
  };

  const swatchSection = {
    onLoad() {
      makeSwatches(this.container);
    },
  };

  const selectors$g = {
    form: 'form',
    popoutWrapper: '[data-popout]',
    popoutList: '[data-popout-list]',
    popoutToggle: '[data-popout-toggle]',
    popoutInput: '[data-popout-input]',
    popoutOptions: '[data-popout-option]',
    popoutText: '[data-popout-text]',
    ariaCurrent: '[aria-current]',
    productGridImage: '[data-product-image]',
    productGrid: '[data-product-grid-item]',
  };

  const classes$e = {
    listVisible: 'select-popout__list--visible',
    popoutAlternative: 'select-popout--alt',
    currentSuffix: '--current',
    visible: 'is-visible',
  };

  const attributes$9 = {
    ariaCurrent: 'aria-current',
    ariaExpanded: 'aria-expanded',
    dataValue: 'data-value',
    popoutPrevent: 'data-popout-prevent',
    popoutQuantity: 'data-quantity-field',
    quickViewItem: 'data-quick-view-item',
  };

  let sections$1 = {};

  class Popout {
    constructor(popout) {
      this.popout = popout;
      this.popoutList = this.popout.querySelector(selectors$g.popoutList);
      this.popoutToggle = this.popout.querySelector(selectors$g.popoutToggle);
      this.popoutText = this.popout.querySelector(selectors$g.popoutText);
      this.popoutInput = this.popout.querySelector(selectors$g.popoutInput);
      this.popoutOptions = this.popout.querySelectorAll(selectors$g.popoutOptions);
      this.popoutPrevent = this.popout.getAttribute(attributes$9.popoutPrevent) === 'true';
      this.popupToggleFocusoutEvent = (evt) => this.popupToggleFocusout(evt);
      this.popupListFocusoutEvent = (evt) => this.popupListFocusout(evt);
      this.popupToggleClickEvent = (evt) => this.popupToggleClick(evt);
      this.popoutKeyupEvent = (evt) => this.popoutKeyup(evt);
      this.popupOptionsClickEvent = (evt) => this.popupOptionsClick(evt);
      this._connectOptionsDispatchEvent = (evt) => this._connectOptionsDispatch(evt);
      this.bodyClick = this.bodyClick.bind(this);
      this.updatePopout = this.updatePopout.bind(this);

      this._connectOptions();
      this._connectToggle();
      this._onFocusOut();

      if (this.popoutInput && this.popoutInput.hasAttribute(attributes$9.popoutQuantity)) {
        document.addEventListener('theme:cart:update', this.updatePopout);
      }
    }

    unload() {
      if (this.popoutOptions.length) {
        this.popoutOptions.forEach((element) => {
          element.removeEventListener('theme:popout:click', this.popupOptionsClickEvent);
          element.removeEventListener('click', this._connectOptionsDispatchEvent);
        });
      }

      this.popoutToggle.removeEventListener('click', this.popupToggleClickEvent);
      this.popoutToggle.removeEventListener('focusout', this.popupToggleFocusoutEvent);
      this.popoutList.removeEventListener('focusout', this.popupListFocusoutEvent);
      this.popout.removeEventListener('keyup', this.popoutKeyupEvent);
      document.removeEventListener('theme:cart:update', this.updatePopout);
      document.body.removeEventListener('click', this.bodyClick);
    }

    popupToggleClick(evt) {
      const ariaExpanded = evt.currentTarget.getAttribute(attributes$9.ariaExpanded) === 'true';

      if (this.popoutList.closest(selectors$g.productGrid)) {
        const productGridItemImage = this.popoutList.closest(selectors$g.productGrid).querySelector(selectors$g.productGridImage);

        if (productGridItemImage) {
          productGridItemImage.classList.toggle(classes$e.visible, !ariaExpanded);
        }
      }

      evt.currentTarget.setAttribute(attributes$9.ariaExpanded, !ariaExpanded);
      this.popoutList.classList.toggle(classes$e.listVisible);
    }

    popupToggleFocusout(evt) {
      if (!evt.relatedTarget) {
        return;
      }

      const popoutLostFocus = this.popout.contains(evt.relatedTarget);
      const popoutFromQuickView = evt.relatedTarget.hasAttribute(attributes$9.quickViewItem);

      if (!popoutLostFocus && !popoutFromQuickView) {
        this._hideList();
      }
    }

    popupListFocusout(evt) {
      const childInFocus = evt.currentTarget.contains(evt.relatedTarget);
      const isVisible = this.popoutList.classList.contains(classes$e.listVisible);

      if (isVisible && !childInFocus) {
        this._hideList();
      }
    }

    popupOptionsClick(evt) {
      const link = evt.target.closest(selectors$g.popoutOptions);
      if (link.attributes.href.value === '#') {
        evt.preventDefault();

        let attrValue = '';

        if (evt.currentTarget.getAttribute(attributes$9.dataValue)) {
          attrValue = evt.currentTarget.getAttribute(attributes$9.dataValue);
        }

        this.popoutInput.value = attrValue;

        if (this.popoutPrevent) {
          this.popoutInput.dispatchEvent(new Event('change'));

          if (!evt.detail.preventTrigger && this.popoutInput.hasAttribute(attributes$9.popoutQuantity)) {
            this.popoutInput.dispatchEvent(new Event('input'));
          }

          const currentElement = this.popoutList.querySelector(`[class*="${classes$e.currentSuffix}"]`);
          let targetClass = classes$e.currentSuffix;

          if (currentElement && currentElement.classList.length) {
            for (const currentElementClass of currentElement.classList) {
              if (currentElementClass.includes(classes$e.currentSuffix)) {
                targetClass = currentElementClass;
                break;
              }
            }
          }

          const listTargetElement = this.popoutList.querySelector(`.${targetClass}`);

          if (listTargetElement) {
            listTargetElement.classList.remove(`${targetClass}`);
            evt.currentTarget.parentElement.classList.add(`${targetClass}`);
          }

          const targetAttribute = this.popoutList.querySelector(selectors$g.ariaCurrent);

          if (targetAttribute) {
            targetAttribute.removeAttribute(attributes$9.ariaCurrent);
            evt.currentTarget.setAttribute(attributes$9.ariaCurrent, 'true');
          }

          if (attrValue !== '') {
            this.popoutText.textContent = attrValue;
          }

          this.popupToggleFocusout(evt);
          this.popupListFocusout(evt);
        } else {
          this._submitForm(attrValue);
        }
      }
    }

    updatePopout() {
      const targetElement = this.popoutList.querySelector(`[${attributes$9.dataValue}="${this.popoutInput.value}"]`);
      if (targetElement) {
        targetElement.dispatchEvent(
          new CustomEvent('theme:popout:click', {
            cancelable: true,
            bubbles: true,
            detail: {
              preventTrigger: true,
            },
          })
        );

        if (!targetElement.parentElement.nextSibling) {
          this.popout.classList.add(classes$e.popoutAlternative);
        }
      } else {
        this.popout.classList.add(classes$e.popoutAlternative);
      }
    }

    popoutKeyup(evt) {
      if (evt.which !== theme.keyboardKeys.ESCAPE) {
        return;
      }
      this._hideList();
      this.popoutToggle.focus();
    }

    bodyClick(evt) {
      const isOption = this.popout.contains(evt.target);
      const isVisible = this.popoutList.classList.contains(classes$e.listVisible);

      if (isVisible && !isOption) {
        this._hideList();
      }
    }

    _connectToggle() {
      this.popoutToggle.addEventListener('click', this.popupToggleClickEvent);
    }

    _connectOptions() {
      if (this.popoutOptions.length) {
        this.popoutOptions.forEach((element) => {
          element.addEventListener('theme:popout:click', this.popupOptionsClickEvent);
          element.addEventListener('click', this._connectOptionsDispatchEvent);
        });
      }
    }

    _connectOptionsDispatch(evt) {
      const event = new CustomEvent('theme:popout:click', {
        cancelable: true,
        bubbles: true,
        detail: {
          preventTrigger: false,
        },
      });

      if (!evt.target.dispatchEvent(event)) {
        evt.preventDefault();
      }
    }

    _onFocusOut() {
      this.popoutToggle.addEventListener('focusout', this.popupToggleFocusoutEvent);
      this.popoutList.addEventListener('focusout', this.popupListFocusoutEvent);
      this.popout.addEventListener('keyup', this.popoutKeyupEvent);

      document.body.addEventListener('click', this.bodyClick);
    }

    _submitForm() {
      const form = this.popout.closest(selectors$g.form);
      if (form) {
        form.submit();
      }
    }

    _hideList() {
      this.popoutList.classList.remove(classes$e.listVisible);
      this.popoutToggle.setAttribute(attributes$9.ariaExpanded, false);
    }
  }

  const popoutSection = {
    onLoad() {
      sections$1[this.id] = [];
      const wrappers = this.container.querySelectorAll(selectors$g.popoutWrapper);
      wrappers.forEach((wrapper) => {
        sections$1[this.id].push(new Popout(wrapper));
      });
    },
    onUnload() {
      sections$1[this.id].forEach((popout) => {
        if (typeof popout.unload === 'function') {
          popout.unload();
        }
      });
    },
  };

  const selectors$h = {
    addToCart: '[data-add-to-cart]',
    deferredMedia: '[data-deferred-media]',
    deferredMediaButton: '[data-deferred-media-button]',
    popupClose: '[data-popup-close]',
    popout: '[data-popout]',
    quickViewInner: '[data-quick-view-inner]',
    quickViewItemHolder: '[data-quick-view-item-holder]',
    product: '[data-product]',
    productForm: '[data-product-form]',
    productMediaSlider: '[data-product-single-media-slider]',
    productMediaWrapper: '[data-product-single-media-wrapper]',
    productModel: '[data-model]',
    productJSON: '[data-product-json]',
    quickViewFootInner: '[data-quick-view-foot-inner]',
    shopTheLookThumb: '[data-shop-the-look-thumb]',
  };

  const classes$f = {
    hasMediaActive: 'has-media-active',
    isActive: 'is-active',
    isLoading: 'is-loading',
    mediaHidden: 'media--hidden',
    noOutline: 'no-outline',
    notificationPopupVisible: 'notification-popup-visible',
    popupQuickViewAnimateIn: 'popup-quick-view--animate-in',
    popupQuickViewAnimateOut: 'popup-quick-view--animate-out',
    popupQuickViewAnimated: 'popup-quick-view--animated',
    popupQuickView: 'popup-quick-view',
    jsQuickViewVisible: 'js-quick-view-visible',
    jsQuickViewFromCart: 'js-quick-view-from-cart',
  };

  const attributes$a = {
    id: 'id',
    mediaId: 'data-media-id',
    sectionId: 'data-section-id',
    handle: 'data-handle',
    loaded: 'loaded',
    tabindex: 'tabindex',
    quickViewOnboarding: 'data-quick-view-onboarding',
    hotspot: 'data-hotspot',
    hotspotRef: 'data-hotspot-ref',
  };

  const ids = {
    addToCartFormId: 'AddToCartForm--',
    addToCartId: 'AddToCart--',
  };

  class LoadQuickview {
    constructor(popup, pswpElement) {
      this.popup = popup;
      this.pswpElement = pswpElement;
      this.quickViewFoot = this.pswpElement.querySelector(selectors$h.quickViewFootInner);
      this.quickViewInner = this.pswpElement.querySelector(selectors$h.quickViewInner);
      this.product = this.pswpElement.querySelectorAll(selectors$h.product);
      this.flkty = [];
      this.videos = [];
      this.productForms = [];
      this.productMediaSliders = this.pswpElement.querySelectorAll(selectors$h.productMediaSlider);
      this.deferredMedias = this.pswpElement.querySelectorAll(selectors$h.deferredMedia);
      this.buttonsShopTheLookThumb = this.pswpElement.querySelectorAll(selectors$h.shopTheLookThumb);
      this.quickViewItemHolders = this.pswpElement.querySelectorAll(selectors$h.quickViewItemHolder);
      this.popupCloseButtons = this.quickViewInner.querySelectorAll(selectors$h.popupClose);
      this.a11y = a11y;

      this.prevent3dModelSubmitEvent = (event) => this.prevent3dModelSubmit(event);
      this.closeOnAnimationEndEvent = (event) => this.closeOnAnimationEnd(event);
      this.closeOnEscapeEvent = (event) => this.closeOnEscape(event);

      this.outerCloseEvent = (event) => {
        if (!this.quickViewInner.contains(event.target)) {
          this.closePopup(event);
        }
      };

      this.product.forEach((item, index) => {
        const isQuickViewOnboarding = item.hasAttribute(attributes$a.quickViewOnboarding);

        if (!isQuickViewOnboarding) {
          this.initItems(item, index);
        }
      });

      this.init();
    }

    handleDraggable(slider, draggableStatus) {
      if (!slider) return;

      slider.options.draggable = Boolean(draggableStatus);
      slider.updateDraggable();
    }

    initItems(item, index) {
      this.addFormSuffix(item);
      this.initProductSlider(item, index);
      this.initProductVideo(item);
      this.initProductModel(item);
      this.initShopifyXrLaunch(item);

      // Init swatches
      makeSwatches(item);

      // Init popouts
      const popoutElements = item.querySelectorAll(selectors$h.popout);
      let popouts = {};

      if (popoutElements.length) {
        popoutElements.forEach((popout, index) => {
          popouts[index] = new Popout(popout);
        });
      }

      const productForm = new ProductAddForm(item.parentNode);
      this.productForms.push(productForm);

      if (Shopify.PaymentButton) {
        Shopify.PaymentButton.init();
      }

      item.classList.remove(classes$f.isLoading);
    }

    init() {
      // Prevent 3d models button redirecting to cart page when enabling/disabling the model a couple of times
      document.addEventListener('submit', this.prevent3dModelSubmitEvent);

      // Custom closing events
      this.popupCloseButtons.forEach((popupClose) => {
        popupClose.addEventListener('keyup', (event) => {
          if (event.keyCode === theme.keyboardKeys.ENTER || event.keyCode === theme.keyboardKeys.SPACE) {
            this.closePopup(event);
          }
        });

        popupClose.addEventListener('click', (event) => {
          this.closePopup(event);
        });
      });

      this.pswpElement.addEventListener('click', this.outerCloseEvent);

      document.dispatchEvent(new CustomEvent('theme:popup:open', {bubbles: true}));

      this.popup.listen('preventDragEvent', (e, isDown, preventObj) => {
        preventObj.prevent = false;
      });

      this.pswpElement.addEventListener('mousedown', () => {
        this.popup.framework.unbind(window, 'pointermove pointerup pointercancel', this.popup);
      });

      // Opening event
      this.popup.listen('initialZoomInEnd', () => {
        document.body.classList.add(classes$f.jsQuickViewVisible);

        this.a11y.trapFocus({
          container: this.quickViewInner,
        });
      });

      this.pswpElement.addEventListener('animationend', this.closeOnAnimationEndEvent);

      this.popup.listen('destroy', () => {
        if (this.flkty.length > 0) {
          requestAnimationFrame(() => {
            this.flkty.forEach((slider) => slider.pausePlayer());
          });
        }
        document.body.classList.remove(classes$f.jsQuickViewVisible);
        document.removeEventListener('keyup', this.closeOnEscapeEvent);
        document.addEventListener('keyup', this.closeOnEscapeEvent);
        this.pswpElement.removeEventListener('click', this.outerCloseEvent);
        this.pswpElement.removeEventListener('animationend', this.closeOnAnimationEndEvent);
        document.removeEventListener('submit', this.prevent3dModelSubmitEvent);

        this.deferredMedias.forEach((deferredMedia) => {
          // Remove the 'loaded' attribute so the videos will can load properly when we reopening the quickview
          deferredMedia.removeAttribute(attributes$a.loaded);
        });
      });

      document.addEventListener('keyup', this.closeOnEscapeEvent);
      document.addEventListener('theme:cart:added', () => {
        if (this.pswpElement.classList.contains(classes$f.popupQuickView)) {
          this.pswpElement.classList.add(classes$f.popupQuickViewAnimateOut);
        }
      });

      this.animateInQuickview();

      // 'Shop the look' thumbnails nav
      this.initShopTheLookListeners();
    }

    initShopTheLookListeners() {
      this.buttonsShopTheLookThumb?.forEach((button) => {
        button.addEventListener('click', (event) => {
          event.preventDefault();

          const thumb = event.target.matches(selectors$h.shopTheLookThumb) ? event.target : event.target.closest(selectors$h.shopTheLookThumb);
          const holder = this.pswpElement.querySelector(`[${attributes$a.hotspot}="${thumb.getAttribute(attributes$a.hotspotRef)}"]`);

          if (thumb.classList.contains(classes$f.isActive) || !holder) return;

          // Handle sliders
          if (this.flkty.length > 0) {
            requestAnimationFrame(() => {
              this.flkty.forEach((slider) => {
                slider.resize();

                const allMediaItems = this.quickViewInner.querySelectorAll(selectors$h.productMediaWrapper);

                // Pause all media
                if (allMediaItems.length) {
                  allMediaItems.forEach((media) => {
                    media.dispatchEvent(new CustomEvent('theme:media:hidden'), {bubbles: true});
                    media.classList.add(classes$f.mediaHidden);
                  });
                }
              });
            });
          }

          // Active Quick View item class toggle
          holder.classList.add(classes$f.isActive);

          this.quickViewItemHolders.forEach((element) => {
            if (element !== holder) {
              element.classList.remove(classes$f.isActive);
            }
          });
        });
      });
    }

    // Prevents the 3d model buttons submitting the form
    prevent3dModelSubmit(event) {
      if (event.submitter.closest(selectors$h.deferredMedia) && event.submitter.closest(selectors$h.productForm)) {
        event.preventDefault();
      }
    }

    closeQuickviewOnMobile() {
      if (window.innerWidth < window.theme.sizes.large && document.body.classList.contains(classes$f.jsQuickViewVisible)) {
        this.popup.close();
      }
    }

    animateInQuickview() {
      this.pswpElement.classList.add(classes$f.popupQuickViewAnimateIn);

      this.quickViewFoot.addEventListener('animationend', (event) => {
        this.handleAnimatedState(event);
      });

      // Mobile
      this.pswpElement.addEventListener('animationend', (event) => {
        this.handleAnimatedState(event, true);
      });
    }

    handleAnimatedState(event, isMobileAnimation = false) {
      if (event.animationName == 'quickViewAnimateInUp') {
        if (isMobileAnimation && window.innerWidth >= window.theme.sizes.small) {
          // Checks mobile animation but it's not mobile screen size
          return;
        }

        this.pswpElement.classList.add(classes$f.popupQuickViewAnimated);
        this.pswpElement.classList.remove(classes$f.popupQuickViewAnimateIn);
        document.body.classList.remove(classes$f.jsQuickViewFromCart); // Clear the class that we are adding in quick-view-popup.js when the animation ends
      }
    }

    closePopup(event) {
      event?.preventDefault();
      this.pswpElement.classList.add(classes$f.popupQuickViewAnimateOut); // Adding this class triggers the 'animationend' event which calls closeOnAnimationEndEvent()

      if (this.productForms.length > 0) {
        this.productForms.forEach((form) => {
          form.destroy();
        });
      }
    }

    closeOnAnimationEnd(event) {
      if (event.animationName == 'quickViewAnimateOutRight' || event.animationName == 'quickViewAnimateOutDown') {
        this.popup.template.classList.remove(classes$f.popupQuickViewAnimateOut, classes$f.popupQuickViewAnimated);
        this.popup.close();
      }
    }

    closeOnEscape(event) {
      const isQuickViewVisible = document.body.classList.contains(classes$f.jsQuickViewVisible);
      const isNotificationVisible = document.body.classList.contains(classes$f.notificationPopupVisible);

      if (event.keyCode === theme.keyboardKeys.ESCAPE && isQuickViewVisible && !isNotificationVisible) {
        this.closePopup(event);
      }
    }

    initProductSlider(item, index) {
      const slider = item.querySelector(selectors$h.productMediaSlider);
      const mediaItems = item.querySelectorAll(selectors$h.productMediaWrapper);

      if (mediaItems.length > 1) {
        const itemSlider = new Flickity(slider, {
          wrapAround: true,
          cellAlign: 'left',
          pageDots: false,
          prevNextButtons: true,
          adaptiveHeight: false,
          pauseAutoPlayOnHover: false,
          selectedAttraction: 0.2,
          friction: 1,
          autoPlay: false,
          on: {
            ready: () => {
              slider.setAttribute(attributes$a.tabindex, '-1');

              // This resize should happen when the show animation of the PhotoSwipe starts and after PhotoSwipe adds the custom 'popup--quickview' class with the mainClass option.
              // This class is changing the slider width with CSS and looks like this is happening after the slider loads which is breaking it. That's why we need to call the resize() method here.
              requestAnimationFrame(() => {
                itemSlider.resize();
              });
            },
            settle: () => {
              const currentSlide = itemSlider.selectedElement;
              const mediaId = currentSlide.getAttribute(attributes$a.mediaId);

              currentSlide.setAttribute(attributes$a.tabindex, '0');

              itemSlider.cells.forEach((slide) => {
                if (slide.element === currentSlide) {
                  return;
                }

                slide.element.setAttribute(attributes$a.tabindex, '-1');
              });

              this.switchMedia(item, mediaId);
            },
          },
        });

        this.flkty.push(itemSlider);

        // Toggle flickity draggable functionality based on media play/pause state
        if (mediaItems.length) {
          mediaItems.forEach((element) => {
            element.addEventListener('theme:media:play', () => {
              this.handleDraggable(this.flkty[index], false);
              element.closest(selectors$h.productMediaSlider).classList.add(classes$f.hasMediaActive);
            });

            element.addEventListener('theme:media:pause', () => {
              this.handleDraggable(this.flkty[index], true);
              element.closest(selectors$h.productMediaSlider).classList.remove(classes$f.hasMediaActive);
            });
          });
        }

        // iOS smooth scrolling fix
        flickitySmoothScrolling(slider);
      }
    }

    switchMedia(item, mediaId) {
      const allMediaItems = this.quickViewInner.querySelectorAll(selectors$h.productMediaWrapper);
      const selectedMedia = item.querySelector(`${selectors$h.productMediaWrapper}[${attributes$a.mediaId}="${mediaId}"]`);
      const isFocusEnabled = !document.body.classList.contains(classes$f.noOutline);

      // Pause other media
      if (allMediaItems.length) {
        allMediaItems.forEach((media) => {
          media.dispatchEvent(new CustomEvent('theme:media:hidden'), {bubbles: true});
          media.classList.add(classes$f.mediaHidden);
        });
      }

      if (isFocusEnabled) {
        selectedMedia.focus();
      }

      selectedMedia.closest(selectors$h.productMediaSlider).classList.remove(classes$f.hasMediaActive);
      selectedMedia.classList.remove(classes$f.mediaHidden);
      selectedMedia.dispatchEvent(new CustomEvent('theme:media:visible'), {bubbles: true});

      // If media is not loaded, trigger poster button click to load it
      const deferredMedia = selectedMedia.querySelector(selectors$h.deferredMedia);
      if (deferredMedia && deferredMedia.getAttribute(attributes$a.loaded) !== 'true') {
        selectedMedia.querySelector(selectors$h.deferredMediaButton).dispatchEvent(new Event('click'));
      }
    }

    initProductVideo(item) {
      const videos = new ProductVideo(item);

      this.videos.push(videos);
    }

    initProductModel(item) {
      const sectionId = item.getAttribute(attributes$a.sectionId);
      const modelItems = item.querySelectorAll(selectors$h.productModel);

      if (modelItems.length) {
        modelItems.forEach((element) => {
          theme.ProductModel.init(element, sectionId);
        });
      }
    }

    initShopifyXrLaunch(item) {
      document.addEventListener('shopify_xr_launch', () => {
        const currentMedia = item.querySelector(`${selectors$h.productModel}:not(.${classes$f.mediaHidden})`);
        currentMedia.dispatchEvent(new CustomEvent('xrLaunch'));
      });
    }

    addFormSuffix(item) {
      const sectionId = item.getAttribute(attributes$a.sectionId);
      const productObject = JSON.parse(item.querySelector(selectors$h.productJSON).innerHTML);

      const formSuffix = `${sectionId}-${productObject.handle}`;
      const productForm = item.querySelector(selectors$h.productForm);
      const addToCart = item.querySelector(selectors$h.addToCart);

      productForm.setAttribute(attributes$a.id, ids.addToCartFormId + formSuffix);
      addToCart.setAttribute(attributes$a.id, ids.addToCartId + formSuffix);
    }
  }

  const settings$2 = {
    unlockScrollDelay: 400,
  };

  const selectors$i = {
    popupContainer: '.pswp',
    popupCloseBtn: '.pswp__custom-close',
    popupIframe: 'iframe, video',
    popupCustomIframe: '.pswp__custom-iframe',
    popupThumbs: '.pswp__thumbs',
    popupButtons: '.pswp__button, .pswp__caption-close',
    product: '[data-product]',
    productJSON: '[data-product-json]',
  };

  const classes$g = {
    current: 'is-current',
    customLoader: 'pswp--custom-loader',
    customOpen: 'pswp--custom-opening',
    loader: 'pswp__loader',
    opened: 'pswp--open',
    popupCloseButton: 'pswp__button--close',
    notificationPopup: 'pswp--notification',
    quickviewPopup: 'popup-quick-view',
    isCartDrawerOpen: 'js-drawer-open-cart',
    quickViewAnimateOut: 'popup-quick-view--animate-out',
  };

  const attributes$b = {
    dataOptionClasses: 'data-pswp-option-classes',
    dataVideoType: 'data-video-type',
  };

  const loaderHTML = `<div class="${classes$g.loader}"><div class="loader loader--image"><div class="loader__image"></div></div></div>`;

  class LoadPhotoswipe {
    constructor(items, options = '', templateIndex = 0, triggerButton = null) {
      this.items = items;
      this.triggerBtn = triggerButton;
      this.pswpElements = document.querySelectorAll(selectors$i.popupContainer);
      this.pswpElement = this.pswpElements[templateIndex];
      this.popup = null;
      this.popupThumbs = null;
      this.popupThumbsContainer = this.pswpElement.querySelector(selectors$i.popupThumbs);
      this.closeBtn = this.pswpElement.querySelector(selectors$i.popupCloseBtn);
      const defaultOptions = {
        history: false,
        focus: false,
        mainClass: '',
      };
      this.options = options !== '' ? options : defaultOptions;
      this.onCloseCallback = () => this.onClose();
      this.dispatchPopupInitEventCallback = () => this.dispatchPopupInitEvent();
      this.setCurrentThumbCallback = () => this.setCurrentThumb();
      this.a11y = a11y;

      this.init();
    }

    init() {
      document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true}));

      this.pswpElement.classList.add(classes$g.customOpen);

      this.initLoader();

      loadScript({url: window.theme.assets.photoswipe})
        .then(() => this.loadPopup())
        .catch((e) => console.error(e));
    }

    initLoader() {
      if (this.pswpElement.classList.contains(classes$g.customLoader) && this.options !== '' && this.options.mainClass) {
        this.pswpElement.setAttribute(attributes$b.dataOptionClasses, this.options.mainClass);
        let loaderElem = document.createElement('div');
        loaderElem.innerHTML = loaderHTML;
        loaderElem = loaderElem.firstChild;
        this.pswpElement.appendChild(loaderElem);
      } else {
        this.pswpElement.setAttribute(attributes$b.dataOptionClasses, '');
      }
    }

    loadPopup() {
      const PhotoSwipe = window.themePhotoswipe.PhotoSwipe.default;
      const PhotoSwipeUI = window.themePhotoswipe.PhotoSwipeUI.default;

      if (this.pswpElement.classList.contains(classes$g.customLoader)) {
        this.pswpElement.classList.remove(classes$g.customLoader);
      }

      this.pswpElement.classList.remove(classes$g.customOpen);

      this.popup = new PhotoSwipe(this.pswpElement, PhotoSwipeUI, this.items, this.options);

      this.popup.listen('afterInit', this.dispatchPopupInitEventCallback);
      this.popup.listen('imageLoadComplete', this.setCurrentThumbCallback);
      this.popup.listen('beforeChange', this.setCurrentThumbCallback);
      this.popup.listen('close', this.onCloseCallback);

      this.popup.init();

      this.initPopupCallback();
    }

    initPopupCallback() {
      if (this.isVideo) {
        this.hideUnusedButtons();
      }

      this.initVideo();
      this.thumbsActions();

      this.a11y.trapFocus({
        container: this.pswpElement,
      });

      if (this.pswpElement.classList.contains(classes$g.quickviewPopup)) {
        new LoadQuickview(this.popup, this.pswpElement);
      }

      if (this.pswpElement.classList.contains(classes$g.notificationPopup)) {
        new LoadNotification(this.popup, this.pswpElement);
      }

      this.closePopup = () => {
        if (this.pswpElement.classList.contains(classes$g.quickviewPopup)) {
          this.pswpElement.classList.add(classes$g.quickViewAnimateOut); // Close the Quickview popup accordingly
        } else {
          this.popup.close();
        }
      };

      if (this.closeBtn) {
        this.closeBtn.addEventListener('click', this.closePopup);
      }

      // Close Quick view popup when product added to cart
      document.addEventListener('theme:cart:added', this.closePopup);
    }

    dispatchPopupInitEvent() {
      if (this.triggerBtn) {
        this.triggerBtn.dispatchEvent(new CustomEvent('theme:popup:init', {bubbles: true}));
      }
    }

    initVideo() {
      const videoContainer = this.pswpElement.querySelector(selectors$i.popupCustomIframe);
      if (videoContainer) {
        const videoType = videoContainer.getAttribute(attributes$b.dataVideoType);
        this.isVideo = true;

        if (videoType == 'youtube') {
          new LoadVideoYT(videoContainer.parentElement);
        } else if (videoType == 'vimeo') {
          new LoadVideoVimeo(videoContainer.parentElement);
        }
      }
    }

    thumbsActions() {
      if (this.popupThumbsContainer && this.popupThumbsContainer.firstChild) {
        this.popupThumbsContainer.addEventListener('wheel', (e) => this.stopDisabledScroll(e));
        this.popupThumbsContainer.addEventListener('mousewheel', (e) => this.stopDisabledScroll(e));
        this.popupThumbsContainer.addEventListener('DOMMouseScroll', (e) => this.stopDisabledScroll(e));

        this.popupThumbs = this.pswpElement.querySelectorAll(`${selectors$i.popupThumbs} > *`);
        this.popupThumbs.forEach((element, i) => {
          element.addEventListener('click', (e) => {
            e.preventDefault();
            element.parentElement.querySelector(`.${classes$g.current}`).classList.remove(classes$g.current);
            element.classList.add(classes$g.current);
            this.popup.goTo(i);
          });
        });
      }
    }

    hideUnusedButtons() {
      const buttons = this.pswpElement.querySelectorAll(selectors$i.popupButtons);
      buttons.forEach((element) => {
        if (!element.classList.contains(classes$g.popupCloseButton)) {
          element.style.display = 'none';
        }
      });
    }

    stopDisabledScroll(e) {
      e.stopPropagation();
    }

    onClose() {
      const popupIframe = this.pswpElement.querySelector(selectors$i.popupIframe);
      if (popupIframe) {
        popupIframe.parentNode.removeChild(popupIframe);
      }

      if (this.popupThumbsContainer && this.popupThumbsContainer.firstChild) {
        while (this.popupThumbsContainer.firstChild) {
          this.popupThumbsContainer.removeChild(this.popupThumbsContainer.firstChild);
        }
      }

      this.pswpElement.setAttribute(attributes$b.dataOptionClasses, '');
      const loaderElem = this.pswpElement.querySelector(`.${classes$g.loader}`);
      if (loaderElem) {
        this.pswpElement.removeChild(loaderElem);
      }

      if (!document.body.classList.contains(classes$g.isCartDrawerOpen)) {
        this.a11y.removeTrapFocus();
      }

      document.removeEventListener('theme:cart:added', this.closePopup);

      // Unlock scroll if only cart drawer is closed and there are no more popups opened
      setTimeout(() => {
        const recentlyOpenedPopups = this.recentlyOpenedPopupsCount();
        const isCartDrawerOpen = document.body.classList.contains(classes$g.isCartDrawerOpen);

        if (recentlyOpenedPopups === 0 && !isCartDrawerOpen) {
          document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));
        }
      }, settings$2.unlockScrollDelay);
    }

    recentlyOpenedPopupsCount() {
      let count = 0;

      this.pswpElements.forEach((popup) => {
        const isOpened = popup.classList.contains(classes$g.opened);

        if (isOpened) {
          count += 1;
        }
      });

      return count;
    }

    setCurrentThumb() {
      const hasThumbnails = this.popupThumbsContainer && this.popupThumbsContainer.firstChild;

      if (hasThumbnails) return;

      const lastCurrentThumb = this.pswpElement.querySelector(`${selectors$i.popupThumbs} > .${classes$g.current}`);
      if (lastCurrentThumb) {
        lastCurrentThumb.classList.remove(classes$g.current);
      }

      if (!this.popupThumbs) {
        return;
      }
      const currentThumb = this.popupThumbs[this.popup.getCurrentIndex()];
      currentThumb.classList.add(classes$g.current);
      this.scrollThumbs(currentThumb);
    }

    scrollThumbs(currentThumb) {
      const thumbsContainerLeft = this.popupThumbsContainer.scrollLeft;
      const thumbsContainerWidth = this.popupThumbsContainer.offsetWidth;
      const thumbsContainerPos = thumbsContainerLeft + thumbsContainerWidth;
      const currentThumbLeft = currentThumb.offsetLeft;
      const currentThumbWidth = currentThumb.offsetWidth;
      const currentThumbPos = currentThumbLeft + currentThumbWidth;

      if (thumbsContainerPos <= currentThumbPos || thumbsContainerPos > currentThumbLeft) {
        const currentThumbMarginLeft = parseInt(window.getComputedStyle(currentThumb).marginLeft);
        this.popupThumbsContainer.scrollTo({
          top: 0,
          left: currentThumbLeft - currentThumbMarginLeft,
          behavior: 'smooth',
        });
      }
    }
  }

  const settings$3 = {
    templateIndex: 0,
  };

  const selectors$j = {
    buttonQuickView: '[data-button-quick-view]',
    quickViewItemsTemplate: '[data-quick-view-items-template]',
    cartDrawer: '[data-cart-drawer]',
    shopTheLookQuickViewButton: '[data-shop-the-look-quick-view-button]',
    shopTheLookThumb: '[data-shop-the-look-thumb]',
    quickViewItemHolder: '[data-quick-view-item-holder]',
  };

  const classes$h = {
    loading: 'is-loading',
    isActive: 'is-active',
    quickViewFromCart: 'js-quick-view-from-cart',
    mainClass: 'popup-quick-view pswp--not-close-btn',
    shopTheLookPopupClass: 'popup-quick-view popup-quick-view--shop-the-look pswp--not-close-btn',
  };

  const attributes$c = {
    loaded: 'data-loaded',
    handle: 'data-handle',
    variantId: 'data-variant-id',
    shopTheLookQuickView: 'data-shop-the-look-quick-view',
    hotspot: 'data-hotspot',
  };

  const options$1 = {
    history: false,
    focus: false,
    mainClass: classes$h.mainClass,
    showHideOpacity: false, // we need that off to control the animation ourselves
    closeOnVerticalDrag: false,
    closeOnScroll: false,
    modal: false,
    escKey: false,
  };

  class QuickViewPopup {
    constructor(container) {
      this.container = container;
      this.a11y = a11y;
      this.buttonsQuickView = this.container.querySelectorAll(selectors$j.buttonQuickView);
      this.buttonsShopTheLookQuickView = this.container.querySelectorAll(selectors$j.shopTheLookQuickViewButton);
      this.popupInitCallback = (trigger) => this.popupInit(trigger);

      this.buttonsQuickView?.forEach((button) => {
        button.addEventListener('click', (event) => this.initPhotoswipe(event));
        button.addEventListener('theme:popup:init', () => {
          button.classList.remove(classes$h.loading);

          if (button.hasAttribute(attributes$c.shopTheLookQuickView)) {
            this.popupInitCallback(button);
          }
        });
      });

      this.buttonsShopTheLookQuickView?.forEach((button) => {
        button.addEventListener('click', () => {
          this.buttonsQuickView[0]?.dispatchEvent(new Event('click'));
        });
      });
    }

    popupInit(trigger) {
      // Handle active Quick View item
      const holder = this.loadPhotoswipe.pswpElement.querySelector(`[${attributes$c.hotspot}="${trigger.getAttribute(attributes$c.hotspot)}"]`);
      const quickViewItemHolders = this.loadPhotoswipe.pswpElement.querySelectorAll(selectors$j.quickViewItemHolder);

      holder.classList.add(classes$h.isActive);

      quickViewItemHolders.forEach((element) => {
        if (element !== holder) {
          element.classList.remove(classes$h.isActive);
        }
      });

      // Handle pointer events
      this.toggleQuickViewButtonsLoadingClasses(true);
      this.toggleQuickViewThumbsLoadingClasses(true);

      const onAnimationInEnd = (event) => {
        // Animation on open
        if (event.animationName === 'quickViewAnimateInUp') {
          requestAnimationFrame(() => {
            this.toggleQuickViewThumbsLoadingClasses(false);
          });
        }

        // Animation on close
        if (event.animationName === 'quickViewAnimateOutDown') {
          this.loadPhotoswipe.pswpElement.removeEventListener('animationend', onAnimationInEnd);
        }
      };

      this.loadPhotoswipe.pswpElement.addEventListener('animationend', onAnimationInEnd);

      this.loadPhotoswipe?.popup?.listen('destroy', () => {
        this.toggleQuickViewButtonsLoadingClasses(false);
        this.toggleQuickViewThumbsLoadingClasses(false);
      });
    }

    toggleQuickViewButtonsLoadingClasses(isLoading = true) {
      if (isLoading) {
        this.buttonsQuickView?.forEach((element) => {
          element.classList.add(classes$h.loading);
        });
        return;
      }

      this.buttonsQuickView?.forEach((element) => {
        element.classList.remove(classes$h.loading);
      });
    }

    toggleQuickViewThumbsLoadingClasses(isLoading = true) {
      this.buttonsShopTheLookThumb = this.loadPhotoswipe?.pswpElement.querySelectorAll(selectors$j.shopTheLookThumb);

      if (isLoading) {
        this.buttonsShopTheLookThumb?.forEach((element) => {
          element.classList.add(classes$h.loading);
        });
        return;
      }

      this.buttonsShopTheLookThumb?.forEach((element) => {
        element.classList.remove(classes$h.loading);
      });
    }

    initPhotoswipe(event) {
      event.preventDefault();

      const button = event.target.matches(selectors$j.buttonQuickView) ? event.target : event.target.closest(selectors$j.buttonQuickView);
      const isMobile = window.innerWidth < theme.sizes.small;
      let quickViewVariant = '';
      let isShopTheLookPopupTrigger = false;

      if (button.hasAttribute(attributes$c.shopTheLookQuickView)) {
        if (!isMobile) return;
        isShopTheLookPopupTrigger = true;
      }

      options$1.mainClass = classes$h.mainClass;
      button.classList.add(classes$h.loading);

      // Add class js-quick-view-from-cart to change the default Quick view animation
      if (button.closest(selectors$j.cartDrawer)) {
        document.body.classList.add(classes$h.quickViewFromCart);
      }

      // Set the trigger element before calling trapFocus
      this.a11y.state.trigger = button;

      if (button.hasAttribute(attributes$c.variantId)) {
        quickViewVariant = `&variant=${button.getAttribute(attributes$c.variantId)}`;
      }

      const productUrl = `${theme.routes.root}products/${button.getAttribute(attributes$c.handle)}?section_id=api-quickview${quickViewVariant}`;

      if (isShopTheLookPopupTrigger) {
        options$1.mainClass = classes$h.shopTheLookPopupClass;

        this.buttonsQuickView.forEach((element) => {
          element.classList.add(classes$h.loading);
        });

        const XMLS = new XMLSerializer();
        const quickViewItemsTemplate = this.container.querySelector(selectors$j.quickViewItemsTemplate).content.firstElementChild.cloneNode(true);

        const itemsData = XMLS.serializeToString(quickViewItemsTemplate);

        this.loadPhotoswipeWithTemplate(itemsData, button);
      } else {
        this.loadPhotoswipeFromFetch(productUrl, button);
      }
    }

    loadPhotoswipeWithTemplate(data, button) {
      const items = [
        {
          html: data,
        },
      ];

      this.loadPhotoswipe = new LoadPhotoswipe(items, options$1, settings$3.templateIndex, button);
    }

    loadPhotoswipeFromFetch(url, button) {
      fetch(url)
        .then((response) => {
          return response.text();
        })
        .then((data) => {
          const items = [
            {
              html: data,
            },
          ];

          this.loadPhotoswipe = new LoadPhotoswipe(items, options$1, settings$3.templateIndex, button);
        })
        .catch((error) => console.log('error: ', error));
    }
  }

  const settings$4 = {
    cartDrawerEnabled: window.theme.settings.cartType === 'drawer',
    timers: {
      addProductTimeout: 1000,
      itemRemovalDelay: 500,
    },
    animations: {
      data: 'data-aos',
      method: 'fade-up',
    },
  };

  const selectors$k = {
    outerSection: '[data-section-id]',
    aos: '[data-aos]',
    additionalCheckoutButtons: '[data-additional-checkout-button]',
    apiContent: '[data-api-content]',
    apiLineItems: '[data-api-line-items]',
    apiUpsellItems: '[data-api-upsell-items]',
    buttonAddToCart: '[data-add-to-cart]',
    upsellButtonByHandle: '[data-handle]',
    cartCloseError: '[data-cart-error-close]',
    cartDrawer: '[data-cart-drawer]',
    cartDrawerTemplate: '[data-cart-drawer-template]',
    cartDrawerToggle: '[data-cart-drawer-toggle]',
    cartDrawerBody: '[data-cart-drawer-body]',
    cartErrors: '[data-cart-errors]',
    cartForm: '[data-cart-form]',
    cartTermsCheckbox: '[data-cart-acceptance-checkbox]',
    cartCheckoutButtonWrapper: '[data-cart-checkout-buttons]',
    cartCheckoutButton: '[data-cart-checkout-button]',
    cartTotalDiscountsTemplate: '[data-cart-total-discount]',
    cartItemRemove: '[data-item-remove]',
    cartItemQty: '[data-quantity-field]',
    cartItemsQty: '[data-cart-items-qty]',
    cartTotal: '[data-cart-total]',
    cartMessage: '[data-cart-message]',
    cartMessageDefault: '[data-message-default]',
    cartPage: '[data-cart-page]',
    cartProgress: '[data-cart-message-progress]',
    cartOriginalTotal: '[data-cart-original-total]',
    cartOriginalTotalPrice: '[data-cart-original-total-price]',
    cartDiscountsHolder: '[data-cart-discounts-holder]',
    emptyMessage: '[data-empty-message]',
    buttonHolder: '[data-foot-holder]',
    item: '[data-cart-item]',
    itemsHolder: '[data-items-holder]',
    itemsWrapper: '[data-items-wrapper]',
    formCloseError: '[data-close-error]',
    formErrorsContainer: '[data-cart-errors-container]',
    upsellHolder: '[data-upsell-holder]',
    errorMessage: '[data-error-message]',
    termsErrorMessage: '[data-terms-error-message]',
    pairProductsHolder: '[data-pair-products-holder]',
    pairProducts: '[data-pair-products]',
    productIDAttribute: 'data-product-id',
    leftToSpend: '[data-left-to-spend]',
    quickBuyForm: '[data-quickbuy-form]',
    productMediaContainer: '[data-product-media-container]',
    formWrapper: '[data-form-wrapper]',
    popupQuickView: '.popup-quick-view',
    popupClose: '[data-popup-close]',
    error: '[data-error]',
  };

  const classes$i = {
    hidden: 'hidden',
    added: 'is-added',
    isHidden: 'is-hidden',
    cartDrawerOpen: 'js-drawer-open-cart',
    open: 'is-open',
    visible: 'is-visible',
    loading: 'is-loading',
    disabled: 'is-disabled',
    success: 'is-success',
    error: 'has-error',
    cartItems: 'cart-toggle-has-items',
    variantSoldOut: 'variant--soldout',
    removed: 'is-removed',
    aosAnimate: 'aos-animate',
    updated: 'is-updated',
    noOutline: 'no-outline',
    productGridImageError: 'product-grid-item__image--error',
  };

  const attributes$d = {
    shippingMessageLimit: 'data-limit',
    cartMessageValue: 'data-cart-message',
    cartTotalPrice: 'data-cart-total-price',
    ariaExpanded: 'aria-expanded',
    disabled: 'disabled',
    value: 'value',
    dataId: 'data-id',
    focusElement: 'data-focus-element',
    upsellButton: 'data-upsell-btn',
    errorContainerQuickBuy: 'data-cart-errors-container-quickbuy',
    notificationPopup: 'data-notification-popup',
    sectionId: 'data-section-id',
  };

  class CartDrawer {
    constructor() {
      if (window.location.pathname === '/password') {
        return;
      }

      this.init();
    }

    init() {
      // DOM Elements
      this.cartToggleButtons = document.querySelectorAll(selectors$k.cartDrawerToggle);
      this.cartPage = document.querySelector(selectors$k.cartPage);
      this.cartDrawer = document.querySelector(selectors$k.cartDrawer);
      this.cart = this.cartDrawer || this.cartPage;

      this.assignArguments();

      this.flktyUpsell = null;
      this.form = null;
      this.collapsible = null;
      this.a11y = a11y;

      this.build = this.build.bind(this);

      // AJAX request
      this.addToCart = this.addToCart.bind(this);
      this.updateCart = this.updateCart.bind(this);

      // Cart events
      this.openCartDrawer = this.openCartDrawer.bind(this);
      this.closeCartDrawer = this.closeCartDrawer.bind(this);
      this.toggleCartDrawer = this.toggleCartDrawer.bind(this);
      this.formSubmitHandler = throttle(this.formSubmitHandler.bind(this), 50);
      this.closeCartError = debounce(() => slideUp(this.cartErrorHolder, 400), 250);
      this.cartDrawerCloseEvent = null;

      // Checking
      this.hasItemsInCart = this.hasItemsInCart.bind(this);
      this.isCartPage = Boolean(this.cartDrawer === null);
      this.showAnimations = Boolean(document.body.dataset.animations === 'true');

      // Set classes
      this.toggleClassesOnContainers = this.toggleClassesOnContainers.bind(this);

      // Flags
      this.totalItems = 0;
      this.isCartDrawerOpen = false;
      this.isCartDrawerLoaded = false;
      this.cartDiscounts = 0;
      this.cartDrawerEnabled = settings$4.cartDrawerEnabled;
      this.cartLimitErrorIsHidden = true;
      this.cartAnimationTimer = 0;

      // Cart Events
      this.cartEvents();
      this.cartAddEvent();
      this.cartDrawerToggleEvents();

      // Init quantity for fields
      this.initQuantity();

      // Init collapsible function for the cart accordions
      if (this.buttonHolder) {
        this.collapsible = new Collapsible(this.buttonHolder);
      }

      if (this.isCartPage) {
        this.renderPairProducts();
      }

      document.addEventListener('theme:popup:open', this.closeCartDrawer);
    }

    /**
     * Assign cart constructor arguments on page load or after cart drawer is loaded
     *
     * @return  {Void}
     */
    assignArguments() {
      this.cartDrawerBody = document.querySelector(selectors$k.cartDrawerBody);
      this.emptyMessage = document.querySelector(selectors$k.emptyMessage);
      this.buttonHolder = document.querySelector(selectors$k.buttonHolder);
      this.itemsHolder = document.querySelector(selectors$k.itemsHolder);
      this.cartItemsQty = document.querySelector(selectors$k.cartItemsQty);
      this.itemsWrapper = document.querySelector(selectors$k.itemsWrapper);
      this.items = document.querySelectorAll(selectors$k.item);
      this.cartTotal = document.querySelector(selectors$k.cartTotal);
      this.cartMessage = document.querySelectorAll(selectors$k.cartMessage);
      this.cartOriginalTotal = document.querySelector(selectors$k.cartOriginalTotal);
      this.cartOriginalTotalPrice = document.querySelector(selectors$k.cartOriginalTotalPrice);
      this.cartTotalDiscountTemplate = document.querySelector(selectors$k.cartTotalDiscountsTemplate).innerHTML;
      this.cartErrorHolder = document.querySelector(selectors$k.cartErrors);
      this.cartCloseErrorMessage = document.querySelector(selectors$k.cartCloseError);
      this.pairProductsHolder = document.querySelector(selectors$k.pairProductsHolder);
      this.pairProducts = document.querySelector(selectors$k.pairProducts);
      this.upsellHolders = document.querySelectorAll(selectors$k.upsellHolder);
      this.cartTermsCheckbox = document.querySelector(selectors$k.cartTermsCheckbox);
      this.cartCheckoutButtonWrapper = document.querySelector(selectors$k.cartCheckoutButtonWrapper);
      this.cartCheckoutButton = document.querySelector(selectors$k.cartCheckoutButton);
      this.cartForm = document.querySelector(selectors$k.cartForm);
      this.cartItemCount = 0;

      if (this.cartMessage.length > 0) {
        this.cartFreeLimitShipping = Number(this.cartMessage[0].getAttribute(attributes$d.shippingMessageLimit)) * 100 * window.Shopify.currency.rate;
        this.subtotal = Number(this.cartMessage[0].getAttribute(attributes$d.cartTotalPrice));
      }

      this.updateProgress();
    }

    /**
     * Init quantity field functionality
     *
     * @return  {Void}
     */

    initQuantity() {
      this.items = document.querySelectorAll(selectors$k.item);

      if (this.items.length) {
        this.items.forEach((item) => {
          const quantity = new QuantityCounter(item, true);

          quantity.init();
          this.customEventsHandle(item);
        });
      }
    }

    /**
     * Custom event who change the cart
     *
     * @return  {Void}
     */

    customEventsHandle(holder) {
      holder.addEventListener(
        'theme:cart:update',
        debounce((event) => {
          this.updateCart(
            {
              id: event.detail.id,
              quantity: event.detail.quantity,
            },
            holder,
            event.detail.valueIsEmpty
          );
        }, 250)
      );
    }

    /**
     * Cart events
     *
     * @return  {Void}
     */

    cartEvents() {
      const cartItemRemove = document.querySelectorAll(selectors$k.cartItemRemove);

      if (cartItemRemove.length) {
        this.totalItems = cartItemRemove.length;
        cartItemRemove.forEach((item) => {
          item.addEventListener('click', (event) => {
            event.preventDefault();
            const cartItem = item.closest(selectors$k.item);

            this.updateCart(
              {
                id: item.getAttribute(attributes$d.dataId),
                quantity: 0,
              },
              cartItem
            );
          });
        });
      }

      if (this.cartCloseErrorMessage) {
        this.cartCloseErrorMessage.removeEventListener('click', this.closeCartError);
        this.cartCloseErrorMessage.addEventListener('click', this.closeCartError);
      }

      if (this.cartTermsCheckbox) {
        this.cartTermsCheckbox.removeEventListener('change', this.formSubmitHandler);
        this.cartCheckoutButtonWrapper.removeEventListener('click', this.formSubmitHandler);
        this.cartForm.removeEventListener('submit', this.formSubmitHandler);

        this.cartTermsCheckbox.addEventListener('change', this.formSubmitHandler);
        this.cartCheckoutButtonWrapper.addEventListener('click', this.formSubmitHandler);
        this.cartForm.addEventListener('submit', this.formSubmitHandler);
      }
    }

    /**
     * Cart event add product to cart
     *
     * @return  {Void}
     */

    cartAddEvent() {
      document.addEventListener('click', (event) => {
        const clickedElement = event.target;

        if (clickedElement.matches(selectors$k.buttonAddToCart) || (clickedElement.closest(selectors$k.buttonAddToCart) && clickedElement)) {
          const button = clickedElement.matches(selectors$k.buttonAddToCart) ? clickedElement : clickedElement.closest(selectors$k.buttonAddToCart);
          const formWrapper = button.closest(selectors$k.formWrapper);
          let formData = '';

          event.preventDefault();

          if (button.hasAttribute(attributes$d.notificationPopup) && formWrapper && formWrapper.classList.contains(classes$i.variantSoldOut)) {
            new NotificationPopup(button);

            return;
          }

          if (button.hasAttribute(selectors$k.productIDAttribute)) {
            formData = `id=${Number(button.getAttribute(selectors$k.productIDAttribute))}`;
          } else {
            this.form = clickedElement.closest('form');
            formData = new FormData(this.form);
            formData = new URLSearchParams(formData).toString();
          }

          if (this.form !== null && this.form.querySelector('[type="file"]')) {
            return;
          }

          if (button.hasAttribute(attributes$d.disabled)) {
            return;
          }

          this.addToCart(formData, button);

          // Hook for cart/add.js event
          document.dispatchEvent(
            new CustomEvent('theme:cart:add', {
              bubbles: true,
              detail: {
                selector: clickedElement,
              },
            })
          );
        }
      });
    }

    /**
     * Get response from the cart
     *
     * @return  {Void}
     */

    getCart() {
      // Render cart drawer if it exists but it's not loaded yet
      if (this.cartDrawer && !this.isCartDrawerLoaded) {
        const alwaysOpen = false;
        this.renderCartDrawer(alwaysOpen);
      }

      fetch(theme.routes.root + 'cart.js')
        .then(this.handleErrors)
        .then((response) => response.json())
        .then((response) => {
          this.cartItemCount = response.item_count;
          this.newTotalItems = response.items.length;

          this.buildTotalPrice(response);

          if (this.cartMessage.length > 0) {
            this.subtotal = response.total_price;
            this.updateProgress();
          }

          return fetch(theme.routes.root + 'cart?section_id=api-cart-items');
        })
        .then((response) => response.text())
        .then((response) => {
          const element = document.createElement('div');
          element.innerHTML = response;

          this.cartToggleButtons.forEach((button) => {
            button.classList.remove(classes$i.cartItems);

            if (this.newTotalItems > 0) {
              button.classList.add(classes$i.cartItems);
            }
          });

          const cleanResponse = element.querySelector(selectors$k.apiContent);
          this.build(cleanResponse);

          this.updateItemsQuantity(this.cartItemCount);
        })
        .catch((error) => console.log(error));
    }

    /**
     * Add item(s) to the cart and show the added item(s)
     *
     * @param   {String}  data
     * @param   {DOM Element}  button
     *
     * @return  {Void}
     */

    addToCart(data, button = null) {
      if (this.cartDrawerEnabled && button) {
        button.classList.add(classes$i.loading);
        button.setAttribute(attributes$d.disabled, true);
      }

      fetch(theme.routes.root + 'cart/add.js', {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: data,
      })
        .then((response) => response.json())
        .then((response) => {
          if (button) {
            button.disabled = true;
          }
          this.addLoadingClass();

          if (response.status) {
            this.addToCartError(response, button);

            this.removeLoadingClass();

            return;
          }

          if (this.cartDrawerEnabled) {
            this.getCart();
          } else {
            window.location = theme.routes.cart_url;
          }
        })
        .catch((error) => console.log(error));
    }

    /**
     * Update cart
     *
     * @param   {Object}  updateData
     *
     * @return  {Void}
     */

    updateCart(updateData = {}, holder = null, valueIsEmpty = false) {
      let newCount = null;
      let oldCount = null;
      let newItem = null;
      let quantity = updateData.quantity;

      this.addLoadingClass();

      // Handle item removal
      if (quantity == 0 && holder) {
        holder.classList.add(classes$i.removed);
        setTimeout(() => {
          holder.remove();
        }, settings$4.timers.itemRemovalDelay);
      }

      this.items.forEach((item) => {
        item.classList.add(classes$i.disabled);
        item.querySelector('input').blur();
        item.querySelectorAll('input, button').forEach((el) => {
          el.setAttribute('disabled', true);
        });
      });

      fetch(theme.routes.root + 'cart.js')
        .then(this.handleErrors)
        .then((response) => response.json())
        .then((response) => {
          const matchKeys = (item) => item.key === updateData.id;
          const index = response.items.findIndex(matchKeys);
          oldCount = response.item_count;
          newItem = response.items[index].title;

          const data = {
            line: `${index + 1}`,
            quantity: quantity,
          };

          return fetch(theme.routes.root + 'cart/change.js', {
            method: 'post',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data),
          });
        })
        .then(this.handleErrors)
        .then((response) => response.json())
        .then((response) => {
          newCount = response.item_count;
          this.cartItemCount = newCount;

          if (valueIsEmpty) {
            quantity = 1;
          }

          if (quantity !== 0) {
            this.cartLimitErrorIsHidden = newCount !== oldCount;

            this.toggleLimitError(newItem);
          }

          // Change the cart total, total items quantity and hide message if missing discounts and the changed product is not deleted
          this.buildTotalPrice(response);
          this.cartDiscounts = response.total_discount;
          this.updateItemsQuantity(this.cartItemCount);

          // Build cart again if the quantity of the changed product is 0 or cart discounts are changed
          if (this.cartMessage.length > 0) {
            this.subtotal = response.total_price;
            this.updateProgress();
          }

          this.getCart();
        })
        .catch((error) => console.log(error));
    }

    /**
     * Show/hide limit error
     *
     * @param   {String}  itemTitle
     *
     * @return  {Void}
     */

    toggleLimitError(itemTitle) {
      this.cartErrorHolder.querySelector(selectors$k.errorMessage).innerText = itemTitle;

      if (this.cartLimitErrorIsHidden) {
        slideUp(this.cartErrorHolder, 400);
      } else {
        slideDown(this.cartErrorHolder, 400);
      }
    }

    /**
     * Handle errors
     *
     * @param   {Object}  response
     *
     * @return  {Object}
     */

    handleErrors(response) {
      if (!response.ok) {
        return response.json().then(function (json) {
          const e = new FetchError({
            status: response.statusText,
            headers: response.headers,
            json: json,
          });
          throw e;
        });
      }
      return response;
    }

    /**
     * Add to cart error handle
     *
     * @param   {Object}  data
     * @param   {DOM Element/Null} button
     *
     * @return  {Void}
     */

    addToCartError(data, button) {
      if (this.cartDrawerEnabled && button && button.closest(selectors$k.cartDrawer) !== null && !button.closest(selectors$k.cartDrawer)) {
        this.closeCartDrawer();
      }

      let outerSection = button.closest(selectors$k.outerSection);

      if (!outerSection) {
        outerSection = button.closest(selectors$k.pairProducts);
      }

      let errorContainer = outerSection.querySelector(selectors$k.formErrorsContainer);

      if (button !== null) {
        const buttonUpsellHolder = button.closest(selectors$k.upsellHolder);
        const buttonQuickBuyForm = button.closest(selectors$k.quickBuyForm);

        if (buttonUpsellHolder && buttonUpsellHolder.querySelector(selectors$k.formErrorsContainer)) {
          errorContainer = buttonUpsellHolder.querySelector(selectors$k.formErrorsContainer);
        }

        if (buttonQuickBuyForm && buttonQuickBuyForm.closest(selectors$k.productMediaContainer)) {
          errorContainer = buttonQuickBuyForm.closest(selectors$k.productMediaContainer).querySelector(selectors$k.formErrorsContainer);
        }

        button.classList.remove(classes$i.loading);
        button.removeAttribute(attributes$d.disabled);
      }

      if (errorContainer) {
        const productMediaContainer = errorContainer.closest(selectors$k.productMediaContainer);
        if (productMediaContainer) {
          productMediaContainer.classList.add(classes$i.productGridImageError);
        } else {
          errorContainer.classList.add(classes$i.visible);
        }
        errorContainer.innerHTML = `<div class="errors" data-error>${data.message}: ${data.description}<button type="button" class="product__errors__close" data-close-error>${theme.icons.closeSmall}</button></div>`;

        if (errorContainer.hasAttribute(attributes$d.errorContainerQuickBuy)) {
          errorContainer.querySelector(selectors$k.error).addEventListener('animationend', () => {
            productMediaContainer.classList.remove(classes$i.productGridImageError);
            errorContainer.innerHTML = '';

            const isFocusEnabled = !document.body.classList.contains(classes$i.noOutline);
            if (!isFocusEnabled) {
              document.activeElement.blur();
            }
          });
        }
      }

      const formErrorClose = document.querySelector(selectors$k.formCloseError);
      if (formErrorClose) {
        formErrorClose.addEventListener('click', (event) => {
          const clickedElement = event.target;
          if (clickedElement.matches(selectors$k.formCloseError) || clickedElement.closest(selectors$k.formCloseError)) {
            event.preventDefault();

            errorContainer.classList.remove(classes$i.visible);
            errorContainer.querySelector(selectors$k.error).addEventListener('transitionend', () => {
              errorContainer.innerHTML = '';
            });
          }
        });
      }
    }

    /**
     * Render cart and define all elements after cart drawer is open for a first time
     *
     * @return  {Void}
     */
    renderCartDrawer(alwaysOpen = true) {
      const cartDrawerTemplate = document.querySelector(selectors$k.cartDrawerTemplate);

      if (!cartDrawerTemplate) {
        return;
      }

      // Append cart items HTML to the cart drawer container
      this.cartDrawer.innerHTML = cartDrawerTemplate.innerHTML;
      this.assignArguments();

      // Bind cart quantity events
      this.initQuantity();

      // Bind cart events
      this.cartEvents();

      // Init collapsible function for the cart drawer accordions
      if (this.buttonHolder) {
        this.collapsible = new Collapsible(this.buttonHolder);
      }

      // Bind cart drawer close button event
      this.cartDrawerToggle = this.cartDrawer.querySelector(selectors$k.cartDrawerToggle);
      this.cartDrawerToggle.addEventListener('click', this.cartDrawerToggleClickEvent);

      this.isCartDrawerLoaded = true;

      this.renderPairProducts();

      // Hook for cart drawer loaded event
      document.dispatchEvent(new CustomEvent('theme:cart:loaded', {bubbles: true}));

      // Open cart drawer after cart items and events are loaded
      if (alwaysOpen) {
        this.openCartDrawer();
      }
    }

    /**
     * Open cart dropdown and add class on body
     *
     * @return  {Void}
     */

    openCartDrawer() {
      if (this.isCartDrawerOpen) {
        return;
      }

      if (!this.isCartDrawerLoaded) {
        this.renderCartDrawer();
        return;
      }

      // Hook for cart drawer open event
      document.dispatchEvent(new CustomEvent('theme:cart:open', {bubbles: true}));
      document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: this.cartDrawer}));
      document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: this.cartDrawerBody}));

      document.body.classList.add(classes$i.cartDrawerOpen);
      this.cartDrawer.classList.add(classes$i.open);

      // Cart elements opening animation
      this.cartDrawer.querySelectorAll(selectors$k.aos).forEach((item) => {
        item.classList.add(classes$i.aosAnimate);
      });

      this.cartToggleButtons.forEach((button) => {
        button.setAttribute(attributes$d.ariaExpanded, true);
      });

      this.a11y.trapFocus({
        container: this.cartDrawer,
      });

      // Observe Additional Checkout Buttons
      this.observeAdditionalCheckoutButtons();
      this.isCartDrawerOpen = true;
    }

    /**
     * Close cart dropdown and remove class on body
     *
     * @return  {Void}
     */

    closeCartDrawer() {
      if (!this.isCartDrawerOpen) {
        return;
      }

      // Hook for cart drawer close event
      document.dispatchEvent(new CustomEvent('theme:cart:close', {bubbles: true}));

      // Cart elements closing animation

      if (this.cartAnimationTimer) {
        clearTimeout(this.cartAnimationTimer);
      }

      this.cartAnimationTimer = setTimeout(() => {
        this.cartDrawer.querySelectorAll(selectors$k.aos).forEach((item) => {
          item.classList.remove(classes$i.aosAnimate);
        });
      }, 300);

      slideUp(this.cartErrorHolder, 400);

      this.a11y.removeTrapFocus();

      this.cartToggleButtons.forEach((button) => {
        button.setAttribute(attributes$d.ariaExpanded, false);
      });

      document.body.classList.remove(classes$i.cartDrawerOpen);
      this.cartDrawer.classList.remove(classes$i.open);
      this.itemsHolder.classList.remove(classes$i.updated);

      // Fixes header background update on cart-drawer close
      const isFocusEnabled = !document.body.classList.contains(classes$i.noOutline);
      if (!isFocusEnabled) {
        requestAnimationFrame(() => {
          document.activeElement.blur();
        });
      }

      // Enable page scroll right after the closing animation ends
      const timeout = 400;
      document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true, detail: timeout}));

      this.isCartDrawerOpen = false;
    }

    /**
     * Toggle cart dropdown
     *
     * @return  {Void}
     */

    toggleCartDrawer() {
      if (this.isCartDrawerOpen) {
        this.closeCartDrawer();
      } else {
        this.openCartDrawer();
      }
    }

    /**
     * Cart drawer toggle events
     *
     * @return  {Void}
     */

    cartDrawerToggleEvents() {
      if (!this.cartDrawer) {
        return;
      }

      // Close cart drawer on ESC key pressed
      this.cartDrawer.addEventListener('keyup', (e) => {
        if (e.which === theme.keyboardKeys.ESCAPE) {
          this.closeCartDrawer();
        }
      });

      // Define cart drawer toggle button click event
      this.cartDrawerToggleClickEvent = (e) => {
        e.preventDefault();
        const button = e.target;

        if (button.getAttribute(attributes$d.ariaExpanded) === 'false') {
          this.a11y.state.trigger = button;
        }

        this.toggleCartDrawer();
      };

      // Define cart drawer close event
      this.cartDrawerCloseEvent = (e) => {
        const isCartDrawerToggle = e.target.matches(selectors$k.cartDrawerToggle);
        const isCartDrawerChild = document.querySelector(selectors$k.cartDrawer).contains(e.target);
        const isPopupQuickView = e.target.closest(selectors$k.popupQuickView);

        if (!isCartDrawerToggle && !isCartDrawerChild && !isPopupQuickView) {
          this.closeCartDrawer();
        }
      };

      // Bind cart drawer toggle buttons click event
      this.cartToggleButtons.forEach((button) => {
        button.addEventListener('click', this.cartDrawerToggleClickEvent);
      });

      // Close drawers on click outside
      //   Replaced 'click' with 'mousedown' as a quick and simple fix to the dragging issue on the upsell slider
      //   which was causing the cart-drawer to close when we start dragging the slider and finish our drag outside the cart-drawer
      //   which was triggering the 'click' event
      document.addEventListener('mousedown', this.cartDrawerCloseEvent);
    }

    /**
     * Toggle classes on different containers and messages
     *
     * @return  {Void}
     */

    toggleClassesOnContainers() {
      const that = this;

      this.emptyMessage.classList.toggle(classes$i.hidden, that.hasItemsInCart());
      this.buttonHolder.classList.toggle(classes$i.hidden, !that.hasItemsInCart());
      this.itemsHolder.classList.toggle(classes$i.hidden, !that.hasItemsInCart());
      this.cartItemsQty.classList.toggle(classes$i.hidden, !that.hasItemsInCart());
    }

    /**
     * Build cart depends on results
     *
     * @param   {Object}  data
     *
     * @return  {Void}
     */

    build(data) {
      const cartItemsData = data.querySelector(selectors$k.apiLineItems);
      const upsellItemsData = data.querySelector(selectors$k.apiUpsellItems);
      const cartEmptyData = Boolean(cartItemsData === null && upsellItemsData === null);

      if (this.totalItems !== this.newTotalItems) {
        this.totalItems = this.newTotalItems;

        this.toggleClassesOnContainers();
      }

      // Add class "is-updated" line items holder to reduce cart items animation delay via CSS variables
      if (this.isCartDrawerOpen) {
        this.itemsHolder.classList.add(classes$i.updated);
      }

      if (cartEmptyData) {
        this.itemsHolder.innerHTML = data;
        this.pairProductsHolder.innerHTML = '';
      } else {
        this.itemsHolder.innerHTML = cartItemsData.innerHTML;
        this.pairProductsHolder.innerHTML = upsellItemsData.innerHTML;

        this.renderPairProducts();
      }

      this.cartEvents();
      this.initQuantity();
      this.resetButtonClasses();
      this.removeLoadingClass();

      document.dispatchEvent(new CustomEvent('theme:cart:added', {bubbles: true}));

      if (this.cartDrawer) {
        this.openCartDrawer();
      }
    }

    /**
     * Check for items in the cart
     *
     * @return  {Void}
     */

    hasItemsInCart() {
      return this.totalItems > 0;
    }

    /**
     * Build total cart total price
     *
     * @param   {Object}  data
     *
     * @return  {Void}
     */

    buildTotalPrice(data) {
      const cartDiscountsHolder = document.querySelector(selectors$k.cartDiscountsHolder);

      if (data.original_total_price > data.total_price && data.cart_level_discount_applications.length > 0) {
        this.cartOriginalTotal.classList.remove(classes$i.hidden);
        if (data.original_total_price === 0) {
          this.cartOriginalTotalPrice.innerHTML = window.theme.strings.free;
        } else {
          this.cartOriginalTotalPrice.innerHTML = themeCurrency.formatMoney(data.original_total_price, theme.moneyWithCurrencyFormat);
        }
      } else {
        this.cartOriginalTotal.classList.add(classes$i.hidden);
      }

      this.cartTotal.innerHTML = data.total_price === 0 ? window.theme.strings.free : themeCurrency.formatMoney(data.total_price, theme.moneyWithCurrencyFormat);

      if (data.cart_level_discount_applications.length > 0) {
        const discountsMarkup = this.buildCartTotalDiscounts(data.cart_level_discount_applications);

        cartDiscountsHolder.classList.remove(classes$i.hidden);
        cartDiscountsHolder.innerHTML = discountsMarkup;
      } else {
        cartDiscountsHolder.classList.add(classes$i.hidden);
      }
    }

    /**
     * Build cart total discounts
     *
     * @param   {Array}  discounts
     *
     * @return  {String}
     */

    buildCartTotalDiscounts(discounts) {
      let discountMarkup = '';

      discounts.forEach((discount) => {
        discountMarkup += Sqrl.render(this.cartTotalDiscountTemplate, {
          discountTitle: discount.title,
          discountTotalAllocatedAmount: themeCurrency.formatMoney(discount.total_allocated_amount, theme.moneyFormat),
        });
      });

      return discountMarkup;
    }

    /**
     * Show/hide free shipping message
     *
     * @param   {Number}  total
     *
     * @return  {Void}
     */

    freeShippingMessageHandle(total) {
      if (this.cartMessage.length > 0) {
        document.querySelectorAll(selectors$k.cartMessage).forEach((message) => {
          const hasFreeShipping = message.hasAttribute(attributes$d.cartMessageValue) && message.getAttribute(attributes$d.cartMessageValue) === 'true' && total !== 0;
          const cartMessageDefault = message.querySelector(selectors$k.cartMessageDefault);

          message.classList.toggle(classes$i.success, total >= this.cartFreeLimitShipping && hasFreeShipping);
          message.classList.toggle(classes$i.isHidden, total === 0);
          cartMessageDefault.classList.toggle(classes$i.isHidden, total >= this.cartFreeLimitShipping);
        });
      }
    }

    /**
     * Update progress when update cart
     *
     * @return  {Void}
     */

    updateProgress() {
      const newPercentValue = (this.subtotal / this.cartFreeLimitShipping) * 100;
      const leftToSpend = theme.settings.currency_code_enable
        ? themeCurrency.formatMoney(this.cartFreeLimitShipping - this.subtotal, theme.moneyWithCurrencyFormat)
        : themeCurrency.formatMoney(this.cartFreeLimitShipping - this.subtotal, theme.moneyFormat);

      if (this.cartMessage.length > 0) {
        document.querySelectorAll(selectors$k.cartMessage).forEach((message) => {
          const cartMessageProgressItems = message.querySelectorAll(selectors$k.cartProgress);
          const leftToSpendMessage = message.querySelector(selectors$k.leftToSpend);

          if (leftToSpendMessage) {
            leftToSpendMessage.innerHTML = leftToSpend.replace('.00', '').replace(',00', '');
          }

          if (cartMessageProgressItems.length) {
            cartMessageProgressItems.forEach((cartMessageProgress, index) => {
              cartMessageProgress.classList.toggle(classes$i.isHidden, this.subtotal / this.cartFreeLimitShipping >= 1);
              cartMessageProgress.style.setProperty('--progress-width', `${newPercentValue}%`);
              if (index === 0) {
                cartMessageProgress.setAttribute(attributes$d.value, newPercentValue);
              }
            });
          }

          this.freeShippingMessageHandle(this.subtotal);
        });
      }
    }

    /**
     * Render Upsell Products
     */
    renderPairProducts() {
      this.flktyUpsell = null;
      this.pairProductsHolder = document.querySelector(selectors$k.pairProductsHolder);
      this.pairProducts = document.querySelector(selectors$k.pairProducts);
      this.upsellHolders = document.querySelectorAll(selectors$k.upsellHolder);

      if (this.pairProductsHolder === null || this.pairProductsHolder === undefined) {
        return;
      }

      // Upsell slider
      const that = this;
      if (this.upsellHolders.length > 1) {
        this.flktyUpsell = new Flickity(this.pairProducts, {
          wrapAround: true,
          pageDots: true,
          adaptiveHeight: true,
          prevNextButtons: false,
          on: {
            ready: function () {
              new QuickViewPopup(that.cart);
              this.reloadCells();
              this.resize();
            },
          },
        });

        return;
      }

      // Single upsell item
      new QuickViewPopup(this.cart);
    }

    updateItemsQuantity(itemsQty) {
      let oneItemText = theme.strings.cart_items_one;
      let manyItemsText = theme.strings.cart_items_many;
      oneItemText = oneItemText.split('}}')[1];
      manyItemsText = manyItemsText.split('}}')[1];

      if (this.cartItemsQty) {
        this.cartItemsQty.textContent = itemsQty === 1 ? `${itemsQty} ${oneItemText}` : `${itemsQty} ${manyItemsText}`;
      }
    }

    observeAdditionalCheckoutButtons() {
      // identify an element to observe
      const additionalCheckoutButtons = this.cart.querySelector(selectors$k.additionalCheckoutButtons);
      if (additionalCheckoutButtons) {
        // create a new instance of `MutationObserver` named `observer`,
        // passing it a callback function
        const observer = new MutationObserver(() => {
          this.a11y.removeTrapFocus();
          this.a11y.trapFocus({
            container: this.cart,
          });
          observer.disconnect();
        });

        // call `observe()` on that MutationObserver instance,
        // passing it the element to observe, and the options object
        observer.observe(additionalCheckoutButtons, {subtree: true, childList: true});
      }
    }

    formSubmitHandler() {
      const termsAccepted = document.querySelector(selectors$k.cartTermsCheckbox).checked;
      const termsError = document.querySelector(selectors$k.termsErrorMessage);

      // Disable form submit if terms and conditions are not accepted
      if (!termsAccepted) {
        if (document.querySelector(selectors$k.termsErrorMessage).length > 0) {
          return;
        }

        termsError.innerText = theme.strings.cart_acceptance_error;
        this.cartCheckoutButton.setAttribute(attributes$d.disabled, true);
        slideDown(termsError, 400);
      } else {
        slideUp(termsError, 400);
        this.cartCheckoutButton.removeAttribute(attributes$d.disabled);
      }
    }

    resetButtonClasses() {
      const buttons = document.querySelectorAll(selectors$k.buttonAddToCart);
      if (buttons) {
        buttons.forEach((button) => {
          if (button.classList.contains(classes$i.loading)) {
            button.classList.remove(classes$i.loading);
            button.classList.add(classes$i.success);

            setTimeout(() => {
              button.removeAttribute(attributes$d.disabled);
              button.classList.remove(classes$i.success);
            }, settings$4.timers.addProductTimeout);
          }
        });
      }
    }

    addLoadingClass() {
      if (this.cartDrawer) {
        this.cartDrawer.classList.add(classes$i.loading);
      } else if (this.itemsWrapper) {
        this.itemsWrapper.classList.add(classes$i.loading);
      }
    }

    removeLoadingClass() {
      if (this.cartDrawer) {
        this.cartDrawer.classList.remove(classes$i.loading);
      } else if (this.itemsWrapper) {
        this.itemsWrapper.classList.remove(classes$i.loading);
      }
    }

    destroy() {
      if (this.cartDrawerToggle) {
        this.cartDrawerToggle.removeEventListener('click', this.cartDrawerToggleClickEvent);
      }

      this.cartToggleButtons.forEach((button) => {
        button.removeEventListener('click', this.cartDrawerToggleClickEvent);
      });

      // Close drawers on click outside
      document.removeEventListener('mousedown', this.cartDrawerCloseEvent);

      if (this.collapsible !== null) {
        this.collapsible.onUnload();
      }
    }
  }

  const selectors$l = {
    drawer: '[data-drawer]',
    drawerToggle: '[data-drawer-toggle]',
    scroller: '[data-scroll]',
  };
  const classes$j = {
    open: 'is-open',
    drawerOpen: 'js-drawer-open',
  };
  const attributes$e = {
    ariaExpanded: 'aria-expanded',
    ariaControls: 'aria-controls',
  };

  class Drawer {
    constructor() {
      this.drawers = document.querySelectorAll(selectors$l.drawer);
      this.drawerToggleButtons = document.querySelectorAll(selectors$l.drawerToggle);
      this.a11y = a11y;

      this.drawerToggleEvent = throttle((e) => {
        this.toggle(e);
      }, 150);

      this.keyPressCloseEvent = throttle((e) => {
        if (e.keyCode === theme.keyboardKeys.ESCAPE) {
          this.close(e);
        }
      }, 150);

      // Define drawer close event
      this.drawerCloseEvent = (e) => {
        const activeDrawer = document.querySelector(`${selectors$l.drawer}.${classes$j.open}`);

        if (!activeDrawer) {
          return;
        }

        const isDrawerToggle = e.target.matches(selectors$l.drawerToggle);
        const isDrawerChild = activeDrawer ? activeDrawer.contains(e.target) : false;

        if (!isDrawerToggle && !isDrawerChild) {
          this.close(e);
        }
      };

      this.initListeners();
    }

    initListeners() {
      // Toggle event for each drawer button
      this.drawerToggleButtons.forEach((button) => {
        button.addEventListener('click', this.drawerToggleEvent);
      });

      // Close drawers if escape key pressed
      this.drawers.forEach((drawer) => {
        drawer.addEventListener('keyup', this.keyPressCloseEvent);

        // Init collapsible mobile dropdowns
        this.collapsible = new Collapsible(drawer);
      });

      // Close drawers on click outside
      document.addEventListener('click', this.drawerCloseEvent);
    }

    toggle(e) {
      e.preventDefault();
      const drawer = document.querySelector(`#${e.target.getAttribute(attributes$e.ariaControls)}`);
      if (!drawer) {
        return;
      }

      const isDrawerOpen = drawer.classList.contains(classes$j.open);

      if (isDrawerOpen) {
        this.close();
      } else {
        this.open(e);
      }
    }

    open(e) {
      const drawerOpenButton = e.target;
      const drawer = document.querySelector(`#${e.target.getAttribute(attributes$e.ariaControls)}`);

      if (!drawer) {
        return;
      }
      const drawerScroller = drawer.querySelector(selectors$l.scroller) || drawer;

      // Disable page scroll right away
      document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: drawerScroller}));
      document.dispatchEvent(new CustomEvent('theme:drawer:open'), {bubbles: true});
      document.body.classList.add(classes$j.drawerOpen);

      drawer.classList.add(classes$j.open);
      drawerOpenButton.setAttribute(attributes$e.ariaExpanded, true);

      setTimeout(() => {
        this.a11y.state.trigger = drawerOpenButton;
        this.a11y.trapFocus({
          container: drawer,
        });
      });
    }

    close() {
      if (!document.body.classList.contains(classes$j.drawerOpen)) {
        return;
      }

      const drawer = document.querySelector(`${selectors$l.drawer}.${classes$j.open}`);

      this.drawerToggleButtons.forEach((button) => {
        button.setAttribute(attributes$e.ariaExpanded, false);
      });

      // Enable page scroll right after the closing animation ends
      const timeout = 400;
      document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true, detail: timeout}));

      this.a11y.removeTrapFocus({
        container: drawer,
      });

      drawer.classList.remove(classes$j.open);
      document.body.classList.remove(classes$j.drawerOpen);
      document.dispatchEvent(new CustomEvent('theme:drawer:close'), {bubbles: true});
    }

    unload() {
      // Close drawer
      this.close();

      // Unbind all event listeners for drawers
      this.drawerToggleButtons.forEach((button) => {
        button.removeEventListener('click', this.drawerToggleEvent);
      });
      this.drawers.forEach((drawer) => {
        drawer.removeEventListener('keyup', this.keyPressCloseEvent);
      });
      document.removeEventListener('click', this.drawerCloseEvent);

      if (this.collapsible) {
        this.collapsible.onUnload();
      }
    }
  }

  Sqrl.filters.define('handle', function (str) {
    str = str.toLowerCase();

    var toReplace = ['"', "'", '\\', '(', ')', '[', ']'];

    // For the old browsers
    for (var i = 0; i < toReplace.length; ++i) {
      str = str.replace(toReplace[i], '');
    }

    str = str.replace(/\W+/g, '-');

    if (str.charAt(str.length - 1) == '-') {
      str = str.replace(/-+\z/, '');
    }

    if (str.charAt(0) == '-') {
      str = str.replace(/\A-+/, '');
    }

    return str;
  });

  Sqrl.filters.define('last', function (str) {
    const words = str.split('-');
    return words[words.length - 1];
  });

  Sqrl.filters.define('asset_url', function (str) {
    let asset = theme.assets.image;
    asset = asset.replace('image', str);
    return asset;
  });

  const selectors$m = {
    scrollToTop: '[data-scroll-top-button]',
  };
  const classes$k = {
    isVisible: 'is-visible',
  };

  // Scroll to top button
  const scrollTopButton = document.querySelector(selectors$m.scrollToTop);
  if (scrollTopButton) {
    scrollTopButton.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth',
      });
    });
    document.addEventListener(
      'scroll',
      throttle(() => {
        scrollTopButton.classList.toggle(classes$k.isVisible, window.pageYOffset > window.innerHeight);
      }, 150)
    );
  }

  theme.ProductModel = (function () {
    let modelJsonSections = {};
    let models = {};
    let xrButtons = {};

    const selectors = {
      productMediaWrapper: '[data-product-single-media-wrapper]',
      mediaGroup: '[data-product-single-media-group]',
      productXr: '[data-shopify-xr]',
      mediaId: 'data-media-id',
      model3d: 'data-shopify-model3d-id',
      modelViewer: 'model-viewer',
      modelJson: '#ModelJson-',
      deferredMedia: '[data-deferred-media]',
      deferredMediaButton: '[data-deferred-media-button]',
    };
    const classes = {
      isLoading: 'is-loading',
      mediaHidden: 'media--hidden',
    };

    function init(mediaContainer, sectionId) {
      modelJsonSections[sectionId] = {
        loaded: false,
      };

      const deferredMediaButton = mediaContainer.querySelector(selectors.deferredMediaButton);

      if (deferredMediaButton) {
        deferredMediaButton.addEventListener('click', loadContent.bind(this, mediaContainer, sectionId));
      }
    }

    function loadContent(mediaContainer, sectionId) {
      if (mediaContainer.querySelector(selectors.deferredMedia).getAttribute('loaded')) {
        return;
      }

      mediaContainer.classList.add(classes.isLoading);
      const content = document.createElement('div');
      content.appendChild(mediaContainer.querySelector('template').content.firstElementChild.cloneNode(true));
      const modelViewerElement = content.querySelector('model-viewer');
      const deferredMedia = mediaContainer.querySelector(selectors.deferredMedia);
      deferredMedia.appendChild(modelViewerElement);
      deferredMedia.setAttribute('loaded', true);
      const mediaId = mediaContainer.dataset.mediaId;
      const modelId = modelViewerElement.dataset.modelId;
      const xrButton = mediaContainer.closest(selectors.mediaGroup).parentElement.querySelector(selectors.productXr);
      xrButtons[sectionId] = {
        element: xrButton,
        defaultId: modelId,
      };

      models[mediaId] = {
        modelId: modelId,
        mediaId: mediaId,
        sectionId: sectionId,
        container: mediaContainer,
        element: modelViewerElement,
      };

      if (!window.ShopifyXR) {
        window.Shopify.loadFeatures([
          {
            name: 'shopify-xr',
            version: '1.0',
            onLoad: setupShopifyXr,
          },
          {
            name: 'model-viewer-ui',
            version: '1.0',
            onLoad: setupModelViewerUi,
          },
        ]);
      } else {
        setupModelViewerUi();
      }
    }

    function setupShopifyXr(errors) {
      if (errors) {
        console.warn(errors);
        return;
      }
      if (!window.ShopifyXR) {
        document.addEventListener('shopify_xr_initialized', function () {
          setupShopifyXr();
        });
        return;
      }

      for (const sectionId in modelJsonSections) {
        if (modelJsonSections.hasOwnProperty(sectionId)) {
          const modelSection = modelJsonSections[sectionId];

          if (modelSection.loaded) {
            continue;
          }

          const modelJson = document.querySelector(`${selectors.modelJson}${sectionId}`);

          if (modelJson) {
            window.ShopifyXR.addModels(JSON.parse(modelJson.innerHTML));
            modelSection.loaded = true;
          }
        }
      }

      window.ShopifyXR.setupXRElements();
    }

    function setupModelViewerUi(errors) {
      if (errors) {
        console.warn(errors);
        return;
      }

      for (const key in models) {
        if (models.hasOwnProperty(key)) {
          const model = models[key];
          if (!model.modelViewerUi) {
            model.modelViewerUi = new Shopify.ModelViewerUI(model.element);
            setupModelViewerListeners(model);
          }
        }
      }
    }

    function setupModelViewerListeners(model) {
      const xrButton = xrButtons[model.sectionId];
      model.container.addEventListener('theme:media:visible', function () {
        xrButton.element.setAttribute(selectors.model3d, model.modelId);

        if (window.theme.touch) {
          return;
        }

        model.modelViewerUi.play();
        model.container.dispatchEvent(new CustomEvent('theme:media:play'), {bubbles: true});
      });

      model.container.addEventListener('theme:media:hidden', function () {
        model.modelViewerUi.pause();
      });

      model.container.addEventListener('xrLaunch', function () {
        model.modelViewerUi.pause();
      });

      model.element.addEventListener('load', () => {
        xrButton.element.setAttribute(selectors.model3d, model.modelId);
        model.container.classList.remove(classes.isLoading);
        model.container.dispatchEvent(new CustomEvent('theme:media:play'), {bubbles: true});
      });

      model.element.addEventListener('shopify_model_viewer_ui_toggle_play', function () {
        pauseOtherMedia(model.mediaId);
        setTimeout(() => {
          // Timeout to trigger play event after pause events
          model.container.dispatchEvent(new CustomEvent('theme:media:play'), {bubbles: true});
        }, 50);
      });
      model.element.addEventListener('shopify_model_viewer_ui_toggle_pause', function () {
        model.container.dispatchEvent(new CustomEvent('theme:media:pause'), {bubbles: true});
      });

      pauseOtherMedia(model.mediaId);
    }

    function pauseOtherMedia(mediaId) {
      const currentMedia = `[${selectors.mediaId}="${mediaId}"]`;
      const otherMedia = document.querySelectorAll(`${selectors.productMediaWrapper}:not(${currentMedia})`);

      if (otherMedia.length) {
        otherMedia.forEach((media) => {
          media.dispatchEvent(new CustomEvent('theme:media:hidden'), {bubbles: true});
          media.classList.add(classes.mediaHidden);
        });
      }
    }

    function removeSectionModels(sectionId) {
      for (const key in models) {
        if (models.hasOwnProperty(key)) {
          const model = models[key];
          if (model.sectionId === sectionId) {
            delete models[key];
          }
        }
      }
      delete modelJsonSections[sectionId];
      delete theme.mediaInstances[sectionId];
    }

    return {
      init: init,
      loadContent: loadContent,
      removeSectionModels: removeSectionModels,
    };
  })();

  const selectors$n = {
    rangeSlider: '[data-range-slider]',
    rangeDotLeft: '[data-range-left]',
    rangeDotRight: '[data-range-right]',
    rangeLine: '[data-range-line]',
    rangeHolder: '[data-range-holder]',
    dataMin: 'data-se-min',
    dataMax: 'data-se-max',
    dataMinValue: 'data-se-min-value',
    dataMaxValue: 'data-se-max-value',
    dataStep: 'data-se-step',
    dataFilterUpdate: 'data-range-filter-update',
    priceMin: '[data-field-price-min]',
    priceMax: '[data-field-price-max]',
  };

  const classes$l = {
    isInitialized: 'is-initialized',
  };

  class RangeSlider {
    constructor(container) {
      this.container = container;
      this.init();
      this.initListener = () => this.init();

      document.addEventListener('theme:filters:init', this.initListener);
    }

    init() {
      this.slider = this.container.querySelector(selectors$n.rangeSlider);

      if (!this.slider) {
        return;
      }

      this.resizeFilters = debounce(this.reset.bind(this), 50);

      this.onMoveEvent = (event) => this.onMove(event);
      this.onStopEvent = (event) => this.onStop(event);
      this.onStartEvent = (event) => this.onStart(event);
      this.startX = 0;
      this.x = 0;

      // retrieve touch button
      this.touchLeft = this.slider.querySelector(selectors$n.rangeDotLeft);
      this.touchRight = this.slider.querySelector(selectors$n.rangeDotRight);
      this.lineSpan = this.slider.querySelector(selectors$n.rangeLine);

      // get some properties
      this.min = parseFloat(this.slider.getAttribute(selectors$n.dataMin));
      this.max = parseFloat(this.slider.getAttribute(selectors$n.dataMax));

      this.step = 0.0;

      // normalize flag
      this.normalizeFact = 20;

      // retrieve default values
      let defaultMinValue = this.min;
      if (this.slider.hasAttribute(selectors$n.dataMinValue)) {
        defaultMinValue = parseFloat(this.slider.getAttribute(selectors$n.dataMinValue));
      }
      let defaultMaxValue = this.max;

      if (this.slider.hasAttribute(selectors$n.dataMaxValue)) {
        defaultMaxValue = parseFloat(this.slider.getAttribute(selectors$n.dataMaxValue));
      }

      // check values are correct
      if (defaultMinValue < this.min) {
        defaultMinValue = this.min;
      }

      if (defaultMaxValue > this.max) {
        defaultMaxValue = this.max;
      }

      if (defaultMinValue > defaultMaxValue) {
        defaultMinValue = defaultMaxValue;
      }

      if (this.slider.getAttribute(selectors$n.dataStep)) {
        this.step = Math.abs(parseFloat(this.slider.getAttribute(selectors$n.dataStep)));
      }

      // initial reset
      this.reset();
      window.addEventListener('theme:resize', this.resizeFilters);

      // usefull values, min, max, normalize fact is the width of both touch buttons
      this.maxX = this.slider.offsetWidth - this.touchRight.offsetWidth;
      this.selectedTouch = null;
      this.initialValue = this.lineSpan.offsetWidth - this.normalizeFact;

      // set defualt values
      this.setMinValue(defaultMinValue);
      this.setMaxValue(defaultMaxValue);

      // link events
      this.touchLeft.addEventListener('mousedown', this.onStartEvent);
      this.touchRight.addEventListener('mousedown', this.onStartEvent);
      this.touchLeft.addEventListener('touchstart', this.onStartEvent, {passive: true});
      this.touchRight.addEventListener('touchstart', this.onStartEvent, {passive: true});

      // initialize
      this.slider.classList.add(classes$l.isInitialized);
    }

    reset() {
      this.touchLeft.style.left = '0px';
      this.touchRight.style.left = this.slider.offsetWidth - this.touchLeft.offsetWidth + 'px';
      this.lineSpan.style.marginLeft = '0px';
      this.lineSpan.style.width = this.slider.offsetWidth - this.touchLeft.offsetWidth + 'px';
      this.startX = 0;
      this.x = 0;

      this.maxX = this.slider.offsetWidth - this.touchRight.offsetWidth;
      this.initialValue = this.lineSpan.offsetWidth - this.normalizeFact;
    }

    setMinValue(minValue) {
      const ratio = (minValue - this.min) / (this.max - this.min);
      this.touchLeft.style.left = Math.ceil(ratio * (this.slider.offsetWidth - (this.touchLeft.offsetWidth + this.normalizeFact))) + 'px';
      this.lineSpan.style.marginLeft = this.touchLeft.offsetLeft + 'px';
      this.lineSpan.style.width = this.touchRight.offsetLeft - this.touchLeft.offsetLeft + 'px';
      this.slider.setAttribute(selectors$n.dataMinValue, minValue);
    }

    setMaxValue(maxValue) {
      const ratio = (maxValue - this.min) / (this.max - this.min);
      this.touchRight.style.left = Math.ceil(ratio * (this.slider.offsetWidth - (this.touchLeft.offsetWidth + this.normalizeFact)) + this.normalizeFact) + 'px';
      this.lineSpan.style.marginLeft = this.touchLeft.offsetLeft + 'px';
      this.lineSpan.style.width = this.touchRight.offsetLeft - this.touchLeft.offsetLeft + 'px';
      this.slider.setAttribute(selectors$n.dataMaxValue, maxValue);
    }

    onStart(event) {
      // Prevent default dragging of selected content
      event.preventDefault();
      let eventTouch = event;

      if (event.touches) {
        eventTouch = event.touches[0];
      }

      if (event.currentTarget === this.touchLeft) {
        this.x = this.touchLeft.offsetLeft;
      } else if (event.currentTarget === this.touchRight) {
        this.x = this.touchRight.offsetLeft;
      }

      this.startX = eventTouch.pageX - this.x;
      this.selectedTouch = event.currentTarget;
      document.addEventListener('mousemove', this.onMoveEvent);
      document.addEventListener('mouseup', this.onStopEvent);
      document.addEventListener('touchmove', this.onMoveEvent, {passive: true});
      document.addEventListener('touchend', this.onStopEvent, {passive: true});
    }

    onMove(event) {
      let eventTouch = event;

      if (event.touches) {
        eventTouch = event.touches[0];
      }

      this.x = eventTouch.pageX - this.startX;

      if (this.selectedTouch === this.touchLeft) {
        if (this.x > this.touchRight.offsetLeft - this.selectedTouch.offsetWidth + 10) {
          this.x = this.touchRight.offsetLeft - this.selectedTouch.offsetWidth + 10;
        } else if (this.x < 0) {
          this.x = 0;
        }

        this.selectedTouch.style.left = this.x + 'px';
      } else if (this.selectedTouch === this.touchRight) {
        if (this.x < this.touchLeft.offsetLeft + this.touchLeft.offsetWidth - 10) {
          this.x = this.touchLeft.offsetLeft + this.touchLeft.offsetWidth - 10;
        } else if (this.x > this.maxX) {
          this.x = this.maxX;
        }
        this.selectedTouch.style.left = this.x + 'px';
      }

      // update line span
      this.lineSpan.style.marginLeft = this.touchLeft.offsetLeft + 'px';
      this.lineSpan.style.width = this.touchRight.offsetLeft - this.touchLeft.offsetLeft + 'px';

      // write new value
      this.calculateValue();

      // call on change
      if (this.slider.getAttribute('on-change')) {
        const fn = new Function('min, max', this.slider.getAttribute('on-change'));
        fn(this.slider.getAttribute(selectors$n.dataMinValue), this.slider.getAttribute(selectors$n.dataMaxValue));
      }

      this.onChange(this.slider.getAttribute(selectors$n.dataMinValue), this.slider.getAttribute(selectors$n.dataMaxValue));
    }

    onStop(event) {
      document.removeEventListener('mousemove', this.onMoveEvent);
      document.removeEventListener('mouseup', this.onStopEvent);
      document.removeEventListener('touchmove', this.onMoveEvent, {passive: true});
      document.removeEventListener('touchend', this.onStopEvent, {passive: true});

      this.selectedTouch = null;

      // write new value
      this.calculateValue();

      // call did changed
      this.onChanged(this.slider.getAttribute(selectors$n.dataMinValue), this.slider.getAttribute(selectors$n.dataMaxValue));
    }

    onChange(min, max) {
      const rangeHolder = this.slider.closest(selectors$n.rangeHolder);
      if (rangeHolder) {
        const priceMin = rangeHolder.querySelector(selectors$n.priceMin);
        const priceMax = rangeHolder.querySelector(selectors$n.priceMax);

        if (priceMin && priceMax) {
          priceMin.value = parseInt(min);
          priceMax.value = parseInt(max);
        }
      }
    }

    onChanged(min, max) {
      if (this.slider.hasAttribute(selectors$n.dataFilterUpdate)) {
        this.slider.dispatchEvent(new CustomEvent('theme:filter:range-update', {bubbles: true}));
      }
    }

    calculateValue() {
      const newValue = (this.lineSpan.offsetWidth - this.normalizeFact) / this.initialValue;
      let minValue = this.lineSpan.offsetLeft / this.initialValue;
      let maxValue = minValue + newValue;

      minValue = minValue * (this.max - this.min) + this.min;
      maxValue = maxValue * (this.max - this.min) + this.min;

      if (this.step !== 0.0) {
        let multi = Math.floor(minValue / this.step);
        minValue = this.step * multi;

        multi = Math.floor(maxValue / this.step);
        maxValue = this.step * multi;
      }

      if (this.selectedTouch === this.touchLeft) {
        this.slider.setAttribute(selectors$n.dataMinValue, minValue);
      }

      if (this.selectedTouch === this.touchRight) {
        this.slider.setAttribute(selectors$n.dataMaxValue, maxValue);
      }
    }

    unload() {
      document.removeEventListener('theme:filters:init', this.initListener);
      window.removeEventListener('theme:resize', this.resizeFilters);
    }
  }

  const selectors$o = {
    slider: '[data-slider]',
    productMediaContainer: '[data-product-media-container]',
    productMediaSlider: '[data-product-media-slideshow]',
    productMediaSlide: '[data-product-media-slideshow-slide]',
    progressBar: '[data-product-slideshow-progress]',
    flickityButton: '.flickity-button',
    popupProduct: '[data-product]',
    popupClose: '[data-popup-close]',
  };

  const classes$m = {
    fill: 'fill',
    quickViewVisible: 'js-quick-view-visible',
  };

  const sections$2 = {};

  class ProductGrid {
    constructor(container) {
      this.container = container;
      this.body = document.body;
      this.sliders = this.container.querySelectorAll(selectors$o.slider);

      if (theme.settings.productGridHover === 'slideshow' && !window.theme.touch) {
        this.productGridSlideshow();
      }

      new QuickViewPopup(this.container);
    }

    /* Product grid slideshow */
    productGridSlideshow() {
      const productMediaSlider = this.container.querySelectorAll(selectors$o.productMediaSlider);
      const linkedImages = this.container.querySelectorAll(selectors$o.productMediaContainer);

      if (productMediaSlider.length) {
        productMediaSlider.forEach((slider) => {
          const mediaContainer = slider.closest(selectors$o.productMediaContainer);
          const progressBar = mediaContainer.querySelector(selectors$o.progressBar);
          const countImages = slider.querySelectorAll(selectors$o.productMediaSlide).length;
          const autoplaySpeed = 2200;
          const draggable = !this.sliders.length; // Enable dragging if only layout is not Carousel
          let flkty = new Flickity.data(slider);
          let timer = 0;
          let cellSelector = selectors$o.productMediaSlide;

          if (!flkty.isActive && countImages > 1) {
            flkty = new Flickity(slider, {
              draggable: draggable,
              cellSelector: cellSelector,
              contain: true,
              wrapAround: true,
              imagesLoaded: true,
              lazyLoad: true,
              pageDots: false,
              prevNextButtons: false,
              adaptiveHeight: false,
              pauseAutoPlayOnHover: false,
              selectedAttraction: 0.2,
              friction: 1,
              on: {
                ready: () => {
                  this.container.style.setProperty('--autoplay-speed', `${autoplaySpeed}ms`);
                },
                change: () => {
                  if (timer) {
                    clearTimeout(timer);
                  }

                  progressBar.classList.remove(classes$m.fill);

                  requestAnimationFrame(() => {
                    progressBar.classList.add(classes$m.fill);
                  });

                  timer = setTimeout(() => {
                    progressBar.classList.remove(classes$m.fill);
                  }, autoplaySpeed);
                },
                dragEnd: () => {
                  flkty.playPlayer();
                },
              },
            });

            if (!window.theme.touch) {
              mediaContainer.addEventListener('mouseenter', () => {
                progressBar.classList.add(classes$m.fill);

                if (timer) {
                  clearTimeout(timer);
                }

                timer = setTimeout(() => {
                  progressBar.classList.remove(classes$m.fill);
                }, autoplaySpeed);

                flkty.options.autoPlay = autoplaySpeed;
                flkty.playPlayer();
              });
              mediaContainer.addEventListener('mouseleave', () => {
                flkty.stopPlayer();
                if (timer) {
                  clearTimeout(timer);
                }
                progressBar.classList.remove(classes$m.fill);
              });
            }
          }
        });
      }

      // Prevent page redirect on slideshow arrow click
      if (linkedImages.length) {
        linkedImages.forEach((item) => {
          item.addEventListener('click', (e) => {
            if (e.target.matches(selectors$o.flickityButton)) {
              e.preventDefault();
            }
          });
        });
      }
    }

    /**
     * Quickview popup close function
     */
    popupClose() {
      const popupProduct = document.querySelector(selectors$o.popupProduct);
      if (popupProduct) {
        const popupClose = popupProduct.querySelector(selectors$o.popupClose);
        popupClose.dispatchEvent(new Event('click'));
      }
    }

    /**
     * Event callback for Theme Editor `section:block:select` event
     */
    onBlockSelect() {
      if (this.body.classList.contains(classes$m.quickViewVisible)) {
        this.popupClose();
      }
    }

    /**
     * Event callback for Theme Editor `section:deselect` event
     */
    onDeselect() {
      if (this.body.classList.contains(classes$m.quickViewVisible)) {
        this.popupClose();
      }
    }

    /**
     * Event callback for Theme Editor `section:unload` event
     */
    onUnload() {
      if (this.body.classList.contains(classes$m.quickViewVisible)) {
        this.popupClose();
      }
    }
  }

  const productGrid = {
    onLoad() {
      sections$2[this.id] = new ProductGrid(this.container);
    },
    onBlockSelect() {
      sections$2[this.id].onBlockSelect();
    },
    onDeselect() {
      sections$2[this.id].onDeselect();
    },
    onUnload() {
      sections$2[this.id].onUnload();
    },
  };

  const selectors$p = {
    ajaxinateContainer: '#AjaxinateLoop',
    ajaxinatePagination: '#AjaxinatePagination',
  };

  let sections$3 = {};

  class Ajaxify {
    constructor(container) {
      this.container = container;
      this.endlessScroll = null;

      if (theme.settings.enableInfinityScroll) {
        this.init();
      }
    }

    init() {
      this.loadMoreFix();
      this.endlessScroll = new Ajaxinate({
        container: selectors$p.ajaxinateContainer,
        pagination: selectors$p.ajaxinatePagination,
        method: 'scroll',
      });
    }

    loadMoreFix() {
      // Fix ajaxinate in theme editor
      Ajaxinate.prototype.loadMore = function loadMore() {
        this.request = new XMLHttpRequest();

        this.request.onreadystatechange = function success() {
          if (!this.request.responseXML) {
            return;
          }
          if (!this.request.readyState === 4 || !this.request.status === 200) {
            return;
          }

          const newContainer = this.request.responseXML.querySelector(this.settings.container);
          const newPagination = this.request.responseXML.querySelector(this.settings.pagination);

          this.containerElement.insertAdjacentHTML('beforeend', newContainer.innerHTML);

          if (typeof newPagination === 'undefined' || newPagination === null) {
            this.removePaginationElement();
          } else {
            this.paginationElement.innerHTML = newPagination.innerHTML;

            if (this.settings.callback && typeof this.settings.callback === 'function') {
              this.settings.callback(this.request.responseXML);
            }

            this.initialize();
          }
        }.bind(this);

        this.request.open('GET', this.nextPageUrl, true);
        this.request.responseType = 'document';
        this.request.send();
      };
    }

    unload() {
      if (this.endlessScroll) {
        this.endlessScroll.destroy();
      }
    }
  }

  const ajaxify = {
    onLoad() {
      sections$3 = new Ajaxify(this.container);
    },
    onUnload: function () {
      if (typeof sections$3.unload === 'function') {
        sections$3.unload();
      }
    },
  };

  const settings$5 = {
    loadingTimeout: 300,
  };

  const selectors$q = {
    buttons: 'button',
    toggleFilters: '[data-toggle-filters]',
    closeFilters: '[data-close-filters]',
    openFilters: '[data-open-filters]',
    collectionWrapper: '[data-collection-wrapper]',
    collapsibleTrigger: '[data-collapsible-trigger]',
    sortToggle: '[data-sort-toggle]',
    collectionSortOptions: '[data-collection-sort-options]',
    inputs: 'input, select, label, textarea',
    inputSort: '[data-input-sort]',
    filters: '[data-collection-filters]',
    filtersWrapper: '[data-collection-filters-wrapper]',
    filtersList: '[data-collection-filters-list]',
    filtersStickyBar: '[data-collection-sticky-bar]',
    filter: '[data-collection-filter]',
    filterTag: '[data-collection-filter-tag]',
    filterTagButton: '[data-collection-filter-tag-button]',
    filtersForm: '[data-collection-filters-form]',
    filterResetButton: '[data-filter-reset-button]',
    filterTagClearButton: '[data-filter-tag-reset-button]',
    popupsSection: '[data-section-type="popups"]',
    productGrid: '[data-collection-products]',
    productMediaSlideshow: '[data-product-media-slideshow]',
    productMediaSlide: '[data-product-media-slideshow-slide]',
    productsCount: '[data-products-count]',
    priceMin: '[data-field-price-min]',
    priceMax: '[data-field-price-max]',
    rangeMin: '[data-se-min-value]',
    rangeMax: '[data-se-max-value]',
    rangeMinValue: 'data-se-min-value',
    rangeMaxValue: 'data-se-max-value',
    rangeMinDefault: 'data-se-min',
    rangeMaxDefault: 'data-se-max',
    searchForm: '[data-search-form]',
  };

  const classes$n = {
    isActive: 'is-active',
    isExpanded: 'is-expanded',
    isVisible: 'is-visible',
    isLoading: 'is-loading',
    popupVisible: 'popup--visible',
    collectionFiltersVisible: 'collection__filters--visible',
    collectionSortOptionWrapperVisible: 'collection__sort__option-wrapper--visible',
  };

  const attributes$f = {
    filterActive: 'data-filter-active',
    preventScrollLock: 'data-prevent-scroll-lock',
    filtersDefaultState: 'data-filters-default-state',
  };

  const sections$4 = {};

  class Filters {
    constructor(container) {
      this.container = container;
      this.sectionId = container.dataset.sectionId;
      this.enableFilters = container.dataset.enableFilters === 'true';
      this.filterMode = container.dataset.filterMode;
      this.collectionHandle = this.container.dataset.collection;
      this.productGrid = this.container.querySelector(selectors$q.productGrid);
      this.productsCount = this.container.querySelector(selectors$q.productsCount);
      this.groupTagFilters = this.container.querySelectorAll(selectors$q.filter);
      this.filters = this.container.querySelector(selectors$q.filters);
      this.filterTriggers = this.container.querySelectorAll(selectors$q.collapsibleTrigger);
      this.filtersStickyBar = this.container.querySelector(selectors$q.filtersStickyBar);
      this.filtersForm = this.container.querySelector(selectors$q.filtersForm);
      this.searchForm = this.container.querySelector(selectors$q.searchForm);
      this.inputSort = this.container.querySelectorAll(selectors$q.inputSort);
      this.sortToggle = this.container.querySelector(selectors$q.sortToggle);
      this.collectionSortOptions = this.container.querySelector(selectors$q.collectionSortOptions);
      this.a11y = a11y;
      this.filterData = [];
      this.rangeSlider = null;
      this.sortDropdownEvent = () => this.sortDropdownToggle();
      this.onTabHandlerEvent = (event) => this.onTabHandler(event);
      this.updateCollectionFormSortEvent = (event) => this.updateCollectionFormSort(event);
      this.bodyClickEvent = (event) => this.bodyClick(event);
      this.onFilterResetClick = this.onFilterResetClick.bind(this);
      this.onFilterTagResetClick = this.onFilterTagResetClick.bind(this);
      this.onFilterTagClearClick = this.onFilterTagClearClick.bind(this);
      this.onFilterToggleClick = this.onFilterToggleClick.bind(this);
      this.onKeyUpHandler = this.onKeyUpHandler.bind(this);
      this.updateRangeEvent = this.updateRange.bind(this);
      this.debouncedSubmitEvent = debounce((event) => {
        this.onSubmitHandler(event);
      }, 500);
      this.debouncedSortEvent = debounce((event) => {
        this.onSortChange(event);
      }, 500);
      this.productGridEvents = {};

      if (this.filters) {
        this.hideFiltersDrawer = this.hideFiltersDrawer.bind(this);
        this.showFiltersDrawer = this.showFiltersDrawer.bind(this);
        this.resizeEvent = () => this.filtersResizeEvents();
        this.filtersResizeEvents();
        document.addEventListener('theme:resize:width', this.resizeEvent);
      }

      this.initTagFilters();
      this.initFacetedFilters();
      this.bindToggleButtonsEvents();
      this.bindFilterButtonsEvents();
      this.initProductGridEvents(theme.settings.enableInfinityScroll);

      makeSwatches(this.container);
      this.collapsible = new Collapsible(this.container);

      // Update css variable for collection sticky bar height
      setVars();

      window.addEventListener('popstate', this.onHistoryChange.bind(this));

      this.sortToggle?.addEventListener('click', this.sortDropdownEvent);

      document.addEventListener('click', this.bodyClickEvent);
    }

    /*
     * Init faceted filters
     */
    initFacetedFilters() {
      if (this.filterMode == 'tag' || this.filterMode == 'group' || !this.enableFilters) {
        return;
      }

      this.rangeSlider = new RangeSlider(this.container);
    }

    /*
     * Price range slider update
     */
    updateRange() {
      const rangeMin = this.filtersForm.querySelector(selectors$q.rangeMin);
      const rangeMax = this.filtersForm.querySelector(selectors$q.rangeMax);
      const priceMin = this.filtersForm.querySelector(selectors$q.priceMin);
      const priceMax = this.filtersForm.querySelector(selectors$q.priceMax);

      if (rangeMin.hasAttribute(selectors$q.rangeMinValue) && rangeMax.hasAttribute(selectors$q.rangeMaxValue)) {
        const priceMinValue = parseFloat(priceMin.placeholder, 10);
        const priceMaxValue = parseFloat(priceMax.placeholder, 10);
        const rangeMinValue = parseFloat(rangeMin.getAttribute(selectors$q.rangeMinValue), 10);
        const rangeMaxValue = parseFloat(rangeMax.getAttribute(selectors$q.rangeMaxValue), 10);

        if (priceMinValue !== rangeMinValue || priceMaxValue !== rangeMaxValue) {
          priceMin.value = parseInt(rangeMinValue);
          priceMax.value = parseInt(rangeMaxValue);

          this.filtersForm.dispatchEvent(new Event('input', {bubbles: true}));
        }
      }
    }

    /*
     * Render product grid and filters on form submission
     */
    onSubmitHandler(event) {
      event.preventDefault();
      const formData = new FormData(this.filtersForm);
      const searchParams = new URLSearchParams(formData);

      // if submitted price equal to price range min and max remove price parameters
      const rangeMin = this.filtersForm.querySelector(selectors$q.rangeMin);
      const rangeMax = this.filtersForm.querySelector(selectors$q.rangeMax);
      const priceMin = this.filtersForm.querySelector(selectors$q.priceMin);
      const priceMax = this.filtersForm.querySelector(selectors$q.priceMax);
      const checkElements = rangeMin && rangeMax && priceMin && priceMax;

      if (checkElements && rangeMin.hasAttribute(selectors$q.rangeMinDefault) && rangeMax.hasAttribute(selectors$q.rangeMaxDefault)) {
        const rangeMinDefault = parseFloat(rangeMin.getAttribute(selectors$q.rangeMinDefault), 10);
        const rangeMaxDefault = parseFloat(rangeMax.getAttribute(selectors$q.rangeMaxDefault), 10);
        const priceMinValue = !priceMin.value ? rangeMinDefault : parseFloat(priceMin.value, 10);
        const priceMaxValue = !priceMax.value ? rangeMaxDefault : parseFloat(priceMax.value, 10);

        if (priceMinValue <= rangeMinDefault && priceMaxValue >= rangeMaxDefault) {
          searchParams.delete('filter.v.price.gte');
          searchParams.delete('filter.v.price.lte');
        }
      }

      this.renderSection(searchParams.toString(), event);
    }

    /*
     * Call renderSection on history change
     */
    onHistoryChange(event) {
      if (!this.filters) {
        return;
      }

      const searchParams = event.state?.searchParams || '';
      this.renderSection(searchParams, null, false);
    }

    /*
     * Render section on history change or filter/sort change event
     */
    renderSection(searchParams, event, updateURLHash = true) {
      this.startLoading();
      const url = `${window.location.pathname}?section_id=${this.sectionId}&${searchParams}`;
      const filterDataUrl = (element) => element.url === url;
      this.filterData.some(filterDataUrl) ? this.renderSectionFromCache(filterDataUrl, event) : this.renderSectionFromFetch(url, event);

      if (updateURLHash) {
        this.updateURLHash(searchParams);
      }
    }

    /*
     * Render section from fetch call
     */
    renderSectionFromFetch(url) {
      fetch(url)
        .then((response) => response.text())
        .then((responseText) => {
          const html = responseText;
          this.filterData = [...this.filterData, {html, url}];
          this.inputSort = this.container.querySelectorAll(selectors$q.inputSort);
          this.renderFilters(html);
          this.bindFilterButtonsEvents();
          this.hideFiltersOnMobile();
          this.renderProductGrid(html);
          this.updateProductsCount(html);
          this.finishLoading();
          this.mobileFiltersScrollLock();
        });
    }

    /*
     * Render section from Cache
     */
    renderSectionFromCache(filterDataUrl, event) {
      const html = this.filterData.find(filterDataUrl).html;
      this.renderFilters(html, event);
      this.hideFiltersOnMobile();
      this.renderProductGrid(html);
      this.updateProductsCount(html);
      this.finishLoading();
      this.mobileFiltersScrollLock();
    }

    /*
     * Render product grid items on fetch call
     */
    renderProductGrid(html) {
      const newProductGrid = new DOMParser().parseFromString(html, 'text/html').querySelector(selectors$q.productGrid);

      if (!newProductGrid) {
        return;
      }

      this.productGrid.innerHTML = newProductGrid.innerHTML;

      this.initProductGridEvents(theme.settings.enableInfinityScroll);
    }

    /*
     * Update total number of products on fetch call
     */
    updateProductsCount(html) {
      const newProductsCount = new DOMParser().parseFromString(html, 'text/html').querySelector(selectors$q.productsCount);

      if (!newProductsCount) {
        return;
      }

      this.productsCount.innerHTML = newProductsCount.innerHTML;
    }

    /*
     * Render filters on fetch call
     */
    renderFilters(html) {
      const newFilters = new DOMParser().parseFromString(html, 'text/html').querySelector(selectors$q.filters);

      if (!newFilters) {
        return;
      }

      this.filters.innerHTML = newFilters.innerHTML;
      this.filtersForm = document.querySelector(selectors$q.filtersForm);
      this.bindFilterButtonsEvents();
      this.bindToggleButtonsEvents();
      makeSwatches(this.container);
      this.collapsible = new Collapsible(this.container);

      // Init price range slider
      document.dispatchEvent(new CustomEvent('theme:filters:init', {bubbles: true}));
    }

    /*
     * Update URL when filter/sort is changed
     */
    updateURLHash(searchParams) {
      history.pushState({searchParams}, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`);
    }

    /*
     * Bind filter buttons events
     */
    bindFilterButtonsEvents() {
      if (this.inputSort.length > 0) {
        this.inputSort.forEach((input) => {
          input.addEventListener('change', this.updateCollectionFormSortEvent);
        });
      }

      if (this.filterMode == 'tag' || this.filterMode == 'group' || !this.enableFilters) {
        return;
      }

      this.container.querySelectorAll(selectors$q.filterResetButton).forEach((button) => {
        button.addEventListener('click', this.onFilterResetClick, {once: true});
      });

      if (this.filtersForm) {
        this.filtersForm.addEventListener('input', this.debouncedSubmitEvent.bind(this));

        this.filtersForm.addEventListener('theme:filter:range-update', this.updateRangeEvent);
      }

      if (this.collectionSortOptions) {
        this.collectionSortOptions.addEventListener('keyup', this.onTabHandlerEvent);
      }
    }

    /*
     * Render products on specific filter click event
     */
    onFilterResetClick(event) {
      event.preventDefault();
      this.renderSection(new URL(event.currentTarget.href).searchParams.toString());
    }

    /*
     * Bind filter title click events to toggle options visibility
     */
    bindToggleButtonsEvents() {
      this.container.querySelectorAll(selectors$q.toggleFilters).forEach((button) => {
        button.addEventListener('click', this.onFilterToggleClick);
      });
      this.container.querySelectorAll(selectors$q.closeFilters).forEach((button) => {
        button.addEventListener('click', this.hideFiltersDrawer);
      });
      this.container.querySelectorAll(selectors$q.openFilters).forEach((button) => {
        button.addEventListener('click', this.showFiltersDrawer);
      });

      this.container.querySelector(selectors$q.collectionWrapper).addEventListener('keyup', this.onKeyUpHandler);
    }

    onTabHandler(event) {
      if (event.which === theme.keyboardKeys.SPACE || event.which === theme.keyboardKeys.ENTER) {
        const newSortValue = event.target.previousElementSibling.value;

        this.filtersForm.querySelectorAll(selectors$q.inputSort).forEach((input) => {
          if (input.checked) {
            input.checked = false;
          }
          if (input.value === newSortValue) {
            input.checked = true;
          }
        });

        this.filtersForm.dispatchEvent(new Event('input', {bubbles: true}));
        event.target.dispatchEvent(new Event('click', {bubbles: true}));
      }
    }

    /*
     * Event handler on user ESC key press
     */
    onKeyUpHandler(event) {
      if (event.keyCode === theme.keyboardKeys.ESCAPE) {
        this.hideFiltersDrawer();
      }
    }

    /*
     * Toggle filter options on title click
     */
    onFilterToggleClick(event) {
      event.preventDefault();
      setVars(); // Update css variables for correct filters drawer height

      const filtersVisible = this.filters.classList.contains(classes$n.collectionFiltersVisible);

      filtersVisible ? this.hideFiltersDrawer() : this.showFiltersDrawer();
    }

    sortDropdownToggle() {
      if (!this.collectionSortOptions) return;

      this.collectionSortOptions.classList.toggle(classes$n.collectionSortOptionWrapperVisible);
    }

    /*
     * Close the sort dropdown on button click outside the dropdown (for desktop)
     */
    bodyClick(event) {
      if (!this.collectionSortOptions) return;

      const isSortBar = this.sortToggle.contains(event.target);
      const isVisible = this.collectionSortOptions.classList.contains(classes$n.collectionSortOptionWrapperVisible);

      if (isVisible && !isSortBar) {
        this.sortDropdownToggle();
      }
    }

    updateCollectionFormSort(event) {
      const target = event.target;
      const newSortValue = target.value;
      const secondarySortBy = target.closest(selectors$q.collectionSortOptions);

      this.container.querySelectorAll(selectors$q.inputSort).forEach((input) => {
        if (input.value === newSortValue) {
          input.checked = true;
        }
      });

      if (secondarySortBy !== null) {
        this.filtersForm.dispatchEvent(new Event('input', {bubbles: true}));
      }
    }

    /*
     * Scroll down and open collection filters if they are hidden
     */
    showFiltersDrawer() {
      const instance = this;

      this.a11y.state.trigger = document.querySelector(selectors$q.toggleFilters);

      // Trap focus
      this.a11y.trapFocus({
        container: instance.filters,
      });

      this.mobileFiltersScrollLock();
    }

    /*
     * Scroll lock activation for filters drawer (on mobile)
     */
    mobileFiltersScrollLock() {
      // Open filters and scroll lock if only they are hidden on lower sized screens
      if (window.innerWidth < theme.sizes.large) {
        const scrollableElement = document.querySelector(selectors$q.filtersList);

        if (!this.filters.classList.contains(classes$n.collectionFiltersVisible)) {
          this.filters.classList.add(classes$n.collectionFiltersVisible);
        }

        document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: scrollableElement}));
      }
    }

    /*
     * Hide filter accordion elements on mobile
     */
    hideFiltersOnMobile() {
      const filterTriggers = this.container.querySelectorAll(selectors$q.collapsibleTrigger);

      if (window.innerWidth < theme.sizes.large) {
        requestAnimationFrame(() => {
          filterTriggers.forEach((element) => {
            const isFilterActive = element.getAttribute(attributes$f.filterActive) === 'true';

            if (element.classList.contains(classes$n.isExpanded) && !isFilterActive) {
              element.dispatchEvent(new Event('click'));
            }
          });
        });
      }
    }

    /*
     * Show filter accordion elements on desktop if they should be opened by default
     */
    showFiltersOnDesktop() {
      const filterTriggers = this.container.querySelectorAll(selectors$q.collapsibleTrigger);
      const filtersDefaultState = this.container.getAttribute(attributes$f.filtersDefaultState);

      if (filtersDefaultState !== 'open') {
        return;
      }

      filterTriggers.forEach((element) => {
        if (!element.classList.contains(classes$n.isExpanded)) {
          element.dispatchEvent(new Event('click'));
        }
      });
    }

    /*
     * Hide filters drawer
     */
    hideFiltersDrawer() {
      let filtersVisible = this.filters.classList.contains(classes$n.collectionFiltersVisible);
      let loading = this.container.classList.contains(classes$n.isLoading);

      if (filtersVisible) {
        this.filters.classList.remove(classes$n.collectionFiltersVisible);
        this.a11y.removeTrapFocus();
      }

      // Enable page scroll if no loading state
      if (!loading) {
        document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true, detail: settings$5.loadingTimeout}));
      }
    }

    /*
     * Hiding the filters drawer on desktop & hiding the filters on mobile (showing only filter title)
     */
    filtersResizeEvents() {
      if (window.innerWidth >= theme.sizes.large) {
        this.showFiltersOnDesktop();
        this.hideFiltersDrawer();
      } else {
        this.hideFiltersOnMobile();
      }
    }

    /*
     * Init functions required when "Filter by tag/group" is selected from Collection page -> Collection pages -> Filter mode
     */
    initTagFilters() {
      if ((this.filterMode != 'tag' && this.filterMode != 'group') || !this.enableFilters) {
        return;
      }

      this.tags = this.container.dataset.tags.split('+').filter((item) => item);
      this.bindFilterTagButtonsEvents();
      this.bindSortChangeEvent();
    }

    /*
     * Render products when tag filter is selected
     */
    renderTagFiltersProducts(url) {
      this.startLoading();

      if (typeof this.endlessCollection === 'object') {
        this.endlessCollection.unload();
      }

      fetch(url)
        .then((response) => response.text())
        .then((responseText) => {
          const html = responseText;
          const parsedData = new DOMParser().parseFromString(html, 'text/html');
          const productsHTML = parsedData.querySelector(selectors$q.productGrid).innerHTML;
          const filtersHTML = parsedData.querySelector(selectors$q.filters).innerHTML;

          this.productGrid.innerHTML = productsHTML;
          this.filters.innerHTML = filtersHTML;
          this.inputSort = this.container.querySelectorAll(selectors$q.inputSort);
          this.filtersForm = document.querySelector(selectors$q.filtersForm);
          this.filterData = [...this.filterData, {html, url}];
          this.alreadyClicked = false;

          this.bindFilterTagButtonsEvents();
          this.bindFilterButtonsEvents();
          this.bindSortChangeEvent();
          this.bindToggleButtonsEvents();
          this.initProductGridEvents(theme.settings.enableInfinityScroll);
          this.updateProductsCount(html);
          this.mobileFiltersScrollLock();
          this.hideFiltersOnMobile();
          makeSwatches(this.container);
          this.collapsible = new Collapsible(this.container);

          // Update page URL if supported by the browser
          if (history.replaceState) {
            window.history.pushState({path: url}, '', url);
          }
        })
        .catch((error) => {
          this.finishLoading();
          console.log(`Error: ${error}`);
        });
    }

    /*
     * Bind Filter by tag buttons
     */
    bindFilterTagButtonsEvents() {
      this.container.querySelectorAll(selectors$q.filterTagButton).forEach((button) => {
        button.addEventListener('click', this.onFilterTagButtonClick.bind(this));
      });

      this.container.querySelectorAll(selectors$q.filterTagClearButton).forEach((button) => {
        button.addEventListener('click', this.onFilterTagClearClick);
      });

      this.container.querySelectorAll(selectors$q.filterResetButton).forEach((button) => {
        button.addEventListener('click', this.onFilterTagResetClick);
      });
    }

    /*
     * Bind input Sort by change event for "filters by tag/group" only
     */
    bindSortChangeEvent() {
      this.container.querySelectorAll(selectors$q.inputSort).forEach((input) => {
        input.addEventListener('input', this.debouncedSortEvent.bind(this));
      });
    }

    /*
     * Filter by tag buttons click event
     */
    onFilterTagButtonClick(event) {
      event.preventDefault();
      if (this.alreadyClicked) {
        return;
      }
      this.alreadyClicked = true;
      const button = event.currentTarget;
      const selectedTag = button.dataset.tag;
      let isTagSelected = button.parentNode.classList.contains(classes$n.isActive);

      if (isTagSelected) {
        let tagIndex = this.tags.indexOf(selectedTag);

        button.parentNode.classList.remove(classes$n.isActive);

        if (tagIndex > -1) {
          this.tags.splice(tagIndex, 1);
        }
      } else {
        button.parentNode.classList.add(classes$n.isActive);

        this.tags.push(selectedTag);
      }

      let url = this.collectionHandle + '/' + this.tags.join('+') + '?sort_by=' + this.getSortValue();

      // Close filters dropdown on tag select
      this.container.querySelector(selectors$q.filter).classList.remove(classes$n.isExpanded);
      this.container.querySelector(selectors$q.filter).setAttribute('aria-expanded', false);
      this.container.setAttribute('data-tags', '[' + this.tags + ']');
      this.renderTagFiltersProducts(url);
    }

    /*
     * Remove a specific tag filter
     */
    onFilterTagClearClick(event) {
      event.preventDefault();
      if (this.alreadyClicked) {
        return;
      }
      this.alreadyClicked = true;
      const button = event.currentTarget;
      const selectedTag = button.dataset.tag;
      const tagIndex = this.tags.indexOf(selectedTag);

      if (tagIndex > -1) {
        this.tags.splice(tagIndex, 1);
      }
      const url = this.collectionHandle + '/' + this.tags.join('+') + '?sort_by=' + this.getSortValue();

      this.container.setAttribute('data-tags', '[' + this.tags + ']');
      this.renderTagFiltersProducts(url);
    }

    /*
     * Re-render products with the new sort option selected
     */
    onSortChange() {
      let url = this.collectionHandle + '/' + this.tags.join('+') + '?sort_by=' + this.getSortValue();

      this.renderTagFiltersProducts(url);
    }

    /*
     * Get the selected sort option value
     */
    getSortValue() {
      let sortValue = '';
      this.inputSort.forEach((input) => {
        if (input.checked) {
          sortValue = input.value;
        }
      });

      return sortValue;
    }

    /*
     * Filter by tag reset button click event
     */
    onFilterTagResetClick(event) {
      event?.preventDefault();

      if (this.alreadyClicked) {
        return;
      }
      this.alreadyClicked = true;

      this.container.querySelectorAll(selectors$q.filterTag).forEach((element) => {
        element.classList.remove(classes$n.isActive);
      });

      this.container.querySelectorAll(selectors$q.filter).forEach((element) => {
        element.classList.remove(classes$n.isExpanded);
        element.setAttribute('aria-expanded', false);
      });

      // Reset saved tags
      this.tags = [];
      this.container.setAttribute('data-tags', '');

      let url = this.collectionHandle + '/?sort_by=' + this.getSortValue();

      this.renderTagFiltersProducts(url);
    }

    /*
     * Get products container top position
     */
    getProductsOffsetTop() {
      return this.productGrid.getBoundingClientRect().top - document.body.getBoundingClientRect().top - this.filtersStickyBar.offsetHeight;
    }

    /*
     * Get collection page sticky bar top position
     */
    getStickyBarOffsetTop() {
      return this.filtersStickyBar.getBoundingClientRect().top - document.body.getBoundingClientRect().top;
    }

    /*
     * Init all the events required on product grid items
     */
    initProductGridEvents(infinityScroll) {
      if (infinityScroll) {
        this.initInfinityScroll();
        return;
      }

      this.productGridEvents = new ProductGrid(this.container);

      // Stop loading animation
      setTimeout(() => {
        this.finishLoading();
      }, settings$5.loadingTimeout * 1.5);
    }

    /*
     * Init Infinity scroll functionality
     */
    initInfinityScroll() {
      if (typeof this.endlessCollection === 'object') {
        this.endlessCollection.unload();
      }
      this.endlessCollection = new Ajaxify(this.container);
      this.endlessCollection.endlessScroll.settings.callback = () => {
        this.initProductGridEvents(false);
      };
    }

    /*
     * Show loading animation and lock body scroll
     */
    startLoading() {
      this.container.classList.add(classes$n.isLoading);

      if (window.innerWidth >= theme.sizes.large) {
        document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true}));
      }

      let productsTop = this.getProductsOffsetTop();

      window.scrollTo({
        top: productsTop,
        left: 0,
        behavior: 'smooth',
      });
    }

    /*
     * Hide loading animation and unlock body scroll
     */
    finishLoading() {
      const popups = document.querySelectorAll(`${selectors$q.popupsSection} .${classes$n.popupVisible}`);
      const isPopupActive = popups.length > 0;

      this.container.classList.remove(classes$n.isLoading);

      // Unlock the scroll unless there is a visible popup or there are only popups of types 'bar' and 'cookie'
      if (isPopupActive) {
        let preventScrollPopupsCount = 0;
        [...popups].forEach((popup) => {
          if (popup.hasAttribute(attributes$f.preventScrollLock)) {
            preventScrollPopupsCount += 1;
          }
        });

        if (preventScrollPopupsCount === popups.length) {
          document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true, detail: settings$5.loadingTimeout}));
        }
      } else if (window.innerWidth >= theme.sizes.large) {
        document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true, detail: settings$5.loadingTimeout}));
      }
    }

    /*
     * On block:deselect event
     */
    onDeselect() {
      if (this.productGridEvents) {
        this.productGridEvents.onDeselect();
      }
    }

    /*
     * On section:unload event
     */
    onUnload() {
      if (typeof this.endlessCollection === 'object') {
        this.endlessCollection.unload();
      }

      if (this.productGridEvents) {
        this.productGridEvents.onUnload();
      }

      if (this.collapsible) {
        this.collapsible.onUnload();
      }

      if (this.rangeSlider) {
        this.rangeSlider.unload();
      }

      if (this.filters) {
        document.removeEventListener('theme:resize:width', this.resizeEvent);
      }
      document.removeEventListener('click', this.bodyClickEvent);

      if (this.groupTagFilters.length > 0) {
        this.onFilterTagResetClick();
      }
    }
  }

  const filters = {
    onLoad() {
      sections$4[this.id] = new Filters(this.container);
    },
    onDeselect() {
      sections$4[this.id].onDeselect();
    },
    onUnload() {
      sections$4[this.id].onUnload();
    },
  };

  window.Shopify = window.Shopify || {};
  window.Shopify.theme = window.Shopify.theme || {};
  window.Shopify.theme.sections = window.Shopify.theme.sections || {};

  window.Shopify.theme.sections.registered = window.Shopify.theme.sections.registered || {};
  window.Shopify.theme.sections.instances = window.Shopify.theme.sections.instances || [];
  const registered = window.Shopify.theme.sections.registered;
  const instances = window.Shopify.theme.sections.instances;

  const attributes$g = {
    id: 'data-section-id',
    type: 'data-section-type',
  };

  class Registration {
    constructor(type = null, components = []) {
      this.type = type;
      this.components = validateComponentsArray(components);
      this.callStack = {
        onLoad: [],
        onUnload: [],
        onSelect: [],
        onDeselect: [],
        onBlockSelect: [],
        onBlockDeselect: [],
        onReorder: [],
      };
      components.forEach((comp) => {
        for (const [key, value] of Object.entries(comp)) {
          const arr = this.callStack[key];
          if (Array.isArray(arr) && typeof value === 'function') {
            arr.push(value);
          } else {
            console.warn(`Unregisted function: '${key}' in component: '${this.type}'`);
            console.warn(value);
          }
        }
      });
    }

    getStack() {
      return this.callStack;
    }
  }

  class Section {
    constructor(container, registration) {
      this.container = validateContainerElement(container);
      this.id = container.getAttribute(attributes$g.id);
      this.type = registration.type;
      this.callStack = registration.getStack();

      try {
        this.onLoad();
      } catch (e) {
        console.warn(`Error in section: ${this.id}`);
        console.warn(this);
        console.warn(e);
      }
    }

    callFunctions(key, e = null) {
      this.callStack[key].forEach((func) => {
        const props = {
          id: this.id,
          type: this.type,
          container: this.container,
        };
        if (e) {
          func.call(props, e);
        } else {
          func.call(props);
        }
      });
    }

    onLoad() {
      this.callFunctions('onLoad');
    }

    onUnload() {
      this.callFunctions('onUnload');
    }

    onSelect(e) {
      this.callFunctions('onSelect', e);
    }

    onDeselect(e) {
      this.callFunctions('onDeselect', e);
    }

    onBlockSelect(e) {
      this.callFunctions('onBlockSelect', e);
    }

    onBlockDeselect(e) {
      this.callFunctions('onBlockDeselect', e);
    }

    onReorder(e) {
      this.callFunctions('onReorder', e);
    }
  }

  function validateContainerElement(container) {
    if (!(container instanceof Element)) {
      throw new TypeError('Theme Sections: Attempted to load section. The section container provided is not a DOM element.');
    }
    if (container.getAttribute(attributes$g.id) === null) {
      throw new Error('Theme Sections: The section container provided does not have an id assigned to the ' + attributes$g.id + ' attribute.');
    }

    return container;
  }

  function validateComponentsArray(value) {
    if ((typeof value !== 'undefined' && typeof value !== 'object') || value === null) {
      throw new TypeError('Theme Sections: The components object provided is not a valid');
    }

    return value;
  }

  /*
   * @shopify/theme-sections
   * -----------------------------------------------------------------------------
   *
   * A framework to provide structure to your Shopify sections and a load and unload
   * lifecycle. The lifecycle is automatically connected to theme editor events so
   * that your sections load and unload as the editor changes the content and
   * settings of your sections.
   */

  function register(type, components) {
    if (typeof type !== 'string') {
      throw new TypeError('Theme Sections: The first argument for .register must be a string that specifies the type of the section being registered');
    }

    if (typeof registered[type] !== 'undefined') {
      throw new Error('Theme Sections: A section of type "' + type + '" has already been registered. You cannot register the same section type twice');
    }

    if (!Array.isArray(components)) {
      components = [components];
    }

    const section = new Registration(type, components);
    registered[type] = section;

    return registered;
  }

  function load(types, containers) {
    types = normalizeType(types);

    if (typeof containers === 'undefined') {
      containers = document.querySelectorAll('[' + attributes$g.type + ']');
    }

    containers = normalizeContainers(containers);

    types.forEach(function (type) {
      const registration = registered[type];

      if (typeof registration === 'undefined') {
        return;
      }

      containers = containers.filter(function (container) {
        // Filter from list of containers because container already has an instance loaded
        if (isInstance(container)) {
          return false;
        }

        // Filter from list of containers because container doesn't have data-section-type attribute
        if (container.getAttribute(attributes$g.type) === null) {
          return false;
        }

        // Keep in list of containers because current type doesn't match
        if (container.getAttribute(attributes$g.type) !== type) {
          return true;
        }

        instances.push(new Section(container, registration));

        // Filter from list of containers because container now has an instance loaded
        return false;
      });
    });
  }

  function reorder(selector) {
    var instancesToReorder = getInstances(selector);

    instancesToReorder.forEach(function (instance) {
      instance.onReorder();
    });
  }

  function unload(selector) {
    var instancesToUnload = getInstances(selector);

    instancesToUnload.forEach(function (instance) {
      var index = instances
        .map(function (e) {
          return e.id;
        })
        .indexOf(instance.id);
      instances.splice(index, 1);
      instance.onUnload();
    });
  }

  function getInstances(selector) {
    var filteredInstances = [];

    // Fetch first element if its an array
    if (NodeList.prototype.isPrototypeOf(selector) || Array.isArray(selector)) {
      var firstElement = selector[0];
    }

    // If selector element is DOM element
    if (selector instanceof Element || firstElement instanceof Element) {
      var containers = normalizeContainers(selector);

      containers.forEach(function (container) {
        filteredInstances = filteredInstances.concat(
          instances.filter(function (instance) {
            return instance.container === container;
          })
        );
      });

      // If select is type string
    } else if (typeof selector === 'string' || typeof firstElement === 'string') {
      var types = normalizeType(selector);

      types.forEach(function (type) {
        filteredInstances = filteredInstances.concat(
          instances.filter(function (instance) {
            return instance.type === type;
          })
        );
      });
    }

    return filteredInstances;
  }

  function getInstanceById(id) {
    var instance;

    for (var i = 0; i < instances.length; i++) {
      if (instances[i].id === id) {
        instance = instances[i];
        break;
      }
    }
    return instance;
  }

  function isInstance(selector) {
    return getInstances(selector).length > 0;
  }

  function normalizeType(types) {
    // If '*' then fetch all registered section types
    if (types === '*') {
      types = Object.keys(registered);

      // If a single section type string is passed, put it in an array
    } else if (typeof types === 'string') {
      types = [types];

      // If single section constructor is passed, transform to array with section
      // type string
    } else if (types.constructor === Section) {
      types = [types.prototype.type];

      // If array of typed section constructors is passed, transform the array to
      // type strings
    } else if (Array.isArray(types) && types[0].constructor === Section) {
      types = types.map(function (Section) {
        return Section.type;
      });
    }

    types = types.map(function (type) {
      return type.toLowerCase();
    });

    return types;
  }

  function normalizeContainers(containers) {
    // Nodelist with entries
    if (NodeList.prototype.isPrototypeOf(containers) && containers.length > 0) {
      containers = Array.prototype.slice.call(containers);

      // Empty Nodelist
    } else if (NodeList.prototype.isPrototypeOf(containers) && containers.length === 0) {
      containers = [];

      // Handle null (document.querySelector() returns null with no match)
    } else if (containers === null) {
      containers = [];

      // Single DOM element
    } else if (!Array.isArray(containers) && containers instanceof Element) {
      containers = [containers];
    }

    return containers;
  }

  if (window.Shopify.designMode) {
    document.addEventListener('shopify:section:load', function (event) {
      var id = event.detail.sectionId;
      var container = event.target.querySelector('[' + attributes$g.id + '="' + id + '"]');

      if (container !== null) {
        load(container.getAttribute(attributes$g.type), container);
      }
    });

    document.addEventListener('shopify:section:reorder', function (event) {
      var id = event.detail.sectionId;
      var container = event.target.querySelector('[' + attributes$g.id + '="' + id + '"]');
      var instance = getInstances(container)[0];

      if (typeof instance === 'object') {
        reorder(container);
      }
    });

    document.addEventListener('shopify:section:unload', function (event) {
      var id = event.detail.sectionId;
      var container = event.target.querySelector('[' + attributes$g.id + '="' + id + '"]');
      var instance = getInstances(container)[0];

      if (typeof instance === 'object') {
        unload(container);
      }
    });

    document.addEventListener('shopify:section:select', function (event) {
      var instance = getInstanceById(event.detail.sectionId);

      if (typeof instance === 'object') {
        instance.onSelect(event);
      }
    });

    document.addEventListener('shopify:section:deselect', function (event) {
      var instance = getInstanceById(event.detail.sectionId);

      if (typeof instance === 'object') {
        instance.onDeselect(event);
      }
    });

    document.addEventListener('shopify:block:select', function (event) {
      var instance = getInstanceById(event.detail.sectionId);

      if (typeof instance === 'object') {
        instance.onBlockSelect(event);
      }
    });

    document.addEventListener('shopify:block:deselect', function (event) {
      var instance = getInstanceById(event.detail.sectionId);

      if (typeof instance === 'object') {
        instance.onBlockDeselect(event);
      }
    });
  }

  register('collection-template', filters);

  const selectors$r = {
    templateAddresses: '.template-customers-addresses',
    accountForm: '[data-form]',
    addressNewForm: '[data-form-new]',
    btnNew: '[data-button-new]',
    btnEdit: '[data-button-edit]',
    btnDelete: '[data-button-delete]',
    btnCancel: '[data-button-cancel]',
    editAddress: 'data-form-edit',
    addressCountryNew: 'AddressCountryNew',
    addressProvinceNew: 'AddressProvinceNew',
    addressProvinceContainerNew: 'AddressProvinceContainerNew',
    addressCountryOption: '[data-country-option]',
    addressCountry: 'AddressCountry',
    addressProvince: 'AddressProvince',
    addressProvinceContainer: 'AddressProvinceContainer',
    requiredInputs: 'input[type="text"]:not(.optional)',
  };

  const attributes$h = {
    dataFormId: 'data-form-id',
  };

  const classes$o = {
    hidden: 'is-hidden',
    validation: 'validation--showup',
  };

  class Addresses {
    constructor(section) {
      this.section = section;
      this.addressNewForm = this.section.querySelector(selectors$r.addressNewForm);
      this.accountForms = this.section.querySelectorAll(selectors$r.accountForm);

      this.init();
      this.validate();
    }

    init() {
      if (this.addressNewForm) {
        const section = this.section;
        const newAddressForm = this.addressNewForm;
        this.customerAddresses();

        const newButtons = section.querySelectorAll(selectors$r.btnNew);
        if (newButtons.length) {
          newButtons.forEach((button) => {
            button.addEventListener('click', function (e) {
              e.preventDefault();
              button.classList.add(classes$o.hidden);
              newAddressForm.classList.remove(classes$o.hidden);
            });
          });
        }

        const editButtons = section.querySelectorAll(selectors$r.btnEdit);
        if (editButtons.length) {
          editButtons.forEach((button) => {
            button.addEventListener('click', function (e) {
              e.preventDefault();
              const formId = this.getAttribute(attributes$h.dataFormId);
              section.querySelector(`[${selectors$r.editAddress}="${formId}"]`).classList.toggle(classes$o.hidden);
            });
          });
        }

        const deleteButtons = section.querySelectorAll(selectors$r.btnDelete);
        if (deleteButtons.length) {
          deleteButtons.forEach((button) => {
            button.addEventListener('click', function (e) {
              e.preventDefault();
              const formId = this.getAttribute(attributes$h.dataFormId);
              if (confirm(theme.strings.delete_confirm)) {
                Shopify.postLink('/account/addresses/' + formId, {parameters: {_method: 'delete'}});
              }
            });
          });
        }

        const cancelButtons = section.querySelectorAll(selectors$r.btnCancel);
        if (cancelButtons.length) {
          cancelButtons.forEach((button) => {
            button.addEventListener('click', function (e) {
              e.preventDefault();
              this.closest(selectors$r.accountForm).classList.add(classes$o.hidden);
              document.querySelector(selectors$r.btnNew).classList.remove(classes$o.hidden);
            });
          });
        }
      }
    }

    customerAddresses() {
      // Initialize observers on address selectors, defined in shopify_common.js
      if (Shopify.CountryProvinceSelector) {
        new Shopify.CountryProvinceSelector(selectors$r.addressCountryNew, selectors$r.addressProvinceNew, {
          hideElement: selectors$r.addressProvinceContainerNew,
        });
      }

      // Initialize each edit form's country/province selector
      const countryOptions = this.section.querySelectorAll(selectors$r.addressCountryOption);
      countryOptions.forEach((element) => {
        const formId = element.getAttribute(attributes$h.dataFormId);
        const countrySelector = `${selectors$r.addressCountry}_${formId}`;
        const provinceSelector = `${selectors$r.addressProvince}_${formId}`;
        const containerSelector = `${selectors$r.addressProvinceContainer}_${formId}`;

        new Shopify.CountryProvinceSelector(countrySelector, provinceSelector, {
          hideElement: containerSelector,
        });
      });
    }

    validate() {
      this.accountForms.forEach((accountForm) => {
        const form = accountForm.querySelector('form');
        const inputs = form.querySelectorAll(selectors$r.requiredInputs);

        form.addEventListener('submit', (event) => {
          let isEmpty = false;

          // Display notification if input is empty
          inputs.forEach((input) => {
            if (!input.value) {
              input.nextElementSibling.classList.add(classes$o.validation);
              isEmpty = true;
            } else {
              input.nextElementSibling.classList.remove(classes$o.validation);
            }
          });

          if (isEmpty) {
            event.preventDefault();
          }
        });
      });
    }
  }

  const template = document.querySelector(selectors$r.templateAddresses);
  if (template) {
    new Addresses(template);
  }

  const selectors$s = {
    form: '[data-account-form]',
    showReset: '[data-show-reset]',
    hideReset: '[data-hide-reset]',
    recover: '[data-recover-password]',
    login: '[data-login-form]',
    recoverSuccess: '[data-recover-success]',
    recoverSuccessText: '[data-recover-success-text]',
    recoverHash: '#recover',
  };

  const classes$p = {
    hidden: 'is-hidden',
  };

  class Login {
    constructor(form) {
      this.form = form;
      this.showButton = form.querySelector(selectors$s.showReset);
      this.hideButton = form.querySelector(selectors$s.hideReset);
      this.recover = form.querySelector(selectors$s.recover);
      this.login = form.querySelector(selectors$s.login);
      this.success = form.querySelector(selectors$s.recoverSuccess);
      this.successText = form.querySelector(selectors$s.recoverSuccessText);
      this.init();
    }

    init() {
      if (window.location.hash == selectors$s.recoverHash) {
        this.showRecoverPasswordForm();
      } else {
        this.hideRecoverPasswordForm();
      }

      if (this.success) {
        this.successText.classList.remove(classes$p.hidden);
      }

      this.showButton.addEventListener(
        'click',
        (e) => {
          e.preventDefault();
          this.showRecoverPasswordForm();
        },
        false
      );
      this.hideButton.addEventListener(
        'click',
        (e) => {
          e.preventDefault();
          this.hideRecoverPasswordForm();
        },
        false
      );
    }

    showRecoverPasswordForm() {
      this.recover.classList.remove(classes$p.hidden);
      this.login.classList.add(classes$p.hidden);
      window.location.hash = selectors$s.recoverHash;
      return false;
    }

    hideRecoverPasswordForm() {
      this.login.classList.remove(classes$p.hidden);
      this.recover.classList.add(classes$p.hidden);
      window.location.hash = '';
      return false;
    }
  }

  const loginForm = document.querySelector(selectors$s.form);
  if (loginForm) {
    new Login(loginForm);
  }

  register('search-template', filters);

  const selectors$t = {
    frame: '[data-ticker-frame]',
    scale: '[data-ticker-scale]',
    text: '[data-ticker-text]',
    clone: 'data-clone',
  };

  const attributes$i = {
    speed: 'data-marquee-speed',
  };

  const classes$q = {
    animationClass: 'ticker--animated',
    unloadedClass: 'ticker--unloaded',
    comparitorClass: 'ticker__comparitor',
  };

  const settings$6 = {
    moveTime: 1.63, // 100px going to move for 1.63s
    space: 100, // 100px
  };

  class Ticker {
    constructor(el, stopClone = false) {
      this.frame = el;
      this.stopClone = stopClone;
      this.scale = this.frame.querySelector(selectors$t.scale);
      this.text = this.frame.querySelector(selectors$t.text);

      this.comparitor = this.text.cloneNode(true);
      this.comparitor.classList.add(classes$q.comparitorClass);
      this.frame.appendChild(this.comparitor);
      this.scale.classList.remove(classes$q.unloadedClass);
      this.resizeEvent = debounce(() => this.checkWidth(), 100);
      this.listen();
    }

    listen() {
      document.addEventListener('theme:resize:width', this.resizeEvent);
      this.checkWidth();
    }

    checkWidth() {
      const padding = window.getComputedStyle(this.frame).paddingLeft.replace('px', '') * 2;

      if (this.frame.clientWidth - padding < this.comparitor.clientWidth || this.stopClone) {
        this.text.classList.add(classes$q.animationClass);
        if (this.scale.childElementCount === 1) {
          this.clone = this.text.cloneNode(true);
          this.clone.setAttribute(selectors$t.clone, '');
          this.scale.appendChild(this.clone);

          if (this.stopClone) {
            for (let index = 0; index < 10; index++) {
              const cloneSecond = this.text.cloneNode(true);
              cloneSecond.setAttribute(selectors$t.clone, '');
              this.scale.appendChild(cloneSecond);
            }
          }

          let frameSpeed = this.frame.getAttribute(attributes$i.speed);
          if (frameSpeed === null) {
            frameSpeed = 100;
          }
          const speed = settings$6.moveTime * (100 / parseInt(frameSpeed, 10));
          const animationTimeFrame = (this.text.clientWidth / settings$6.space) * speed;

          this.scale.style.setProperty('--animation-time', `${animationTimeFrame}s`);
        }
      } else {
        this.text.classList.add(classes$q.animationClass);
        let clone = this.scale.querySelector(`[${selectors$t.clone}]`);
        if (clone) {
          this.scale.removeChild(clone);
        }
        this.text.classList.remove(classes$q.animationClass);
      }
    }

    unload() {
      document.removeEventListener('theme:resize:width', this.resizeEvent);
    }
  }

  const selectors$u = {
    bar: '[data-bar]',
    barSlide: '[data-slide]',
    frame: '[data-ticker-frame]',
    slider: '[data-slider]',
    tickerScale: '[data-ticker-scale]',
    tickerText: '[data-ticker-text]',
  };

  const attributes$j = {
    slide: 'data-slide',
    speed: 'data-slider-speed',
    stop: 'data-stop',
    style: 'style',
    dataTargetReferrer: 'data-target-referrer',
  };

  const classes$r = {
    desktop: 'desktop',
    mobile: 'mobile',
    tickerAnimated: 'ticker--animated',
  };

  const sections$5 = {};

  class AnnouncementBar {
    constructor(container) {
      this.barHolder = container;
      this.locationPath = location.href;
      this.slides = this.barHolder.querySelectorAll(selectors$u.barSlide);
      this.slider = this.barHolder.querySelector(selectors$u.slider);
      this.flkty = null;

      this.init();
    }

    init() {
      this.removeAnnouncement();

      if (this.slider) {
        this.initSlider();
        document.addEventListener('theme:resize:width', this.initSlider.bind(this));
      }

      if (!this.slider) {
        this.initTickers(true);
      }
    }

    /**
     * Delete announcement which has a target referrer attribute and it is not contained in page URL
     */
    removeAnnouncement() {
      for (let i = 0; i < this.slides.length; i++) {
        const element = this.slides[i];

        if (!element.hasAttribute(attributes$j.dataTargetReferrer)) {
          continue;
        }

        if (this.locationPath.indexOf(element.getAttribute(attributes$j.dataTargetReferrer)) === -1 && !window.Shopify.designMode) {
          element.parentNode.removeChild(element);
        }
      }
    }

    /**
     * Init slider
     */
    initSlider() {
      const slides = this.slider.querySelectorAll(selectors$u.barSlide);

      if (slides) {
        let slideSelector = `${selectors$u.barSlide}`;

        if (window.innerWidth < theme.sizes.small) {
          slideSelector = `${selectors$u.barSlide}:not(.${classes$r.desktop})`;
        } else {
          slideSelector = `${selectors$u.barSlide}:not(.${classes$r.mobile})`;
        }

        if (this.flkty != null) {
          this.flkty.destroy();
        }

        this.flkty = new Flickity(this.slider, {
          cellSelector: slideSelector,
          pageDots: false,
          prevNextButtons: false,
          wrapAround: true,
          autoPlay: parseInt(this.slider.getAttribute(attributes$j.speed), 10),
          on: {
            ready: () => {
              setTimeout(() => {
                this.slider.dispatchEvent(
                  new CustomEvent('slider-is-loaded', {
                    bubbles: true,
                    detail: {
                      slider: this,
                    },
                  })
                );
              }, 10);
            },
          },
        });
        this.flkty.reposition();
      }

      this.slider.addEventListener('slider-is-loaded', () => {
        this.initTickers();
      });
    }

    /**
     * Init tickers in sliders
     */
    initTickers(stopClone = false) {
      const frames = this.barHolder.querySelectorAll(selectors$u.frame);

      frames.forEach((element) => {
        new Ticker(element, stopClone);

        const slides = element.querySelectorAll(selectors$u.barSlide);
        if (slides.length !== 0) {
          const slidesMobile = element.querySelectorAll(`${selectors$u.barSlide}.${classes$r.mobile}`);
          const slidesDesktop = element.querySelectorAll(`${selectors$u.barSlide}.${classes$r.desktop}`);

          if (slides.length === slidesMobile.length) {
            element.parentNode.classList.add(classes$r.mobile);
          } else if (slides.length === slidesDesktop.length) {
            element.parentNode.classList.add(classes$r.desktop);
          }
        }
      });
    }

    toggleTicker(e, isStoped) {
      const tickerScale = e.target.closest(selectors$u.tickerScale);
      const element = document.querySelector(`[${attributes$j.slide}="${e.detail.blockId}"]`);

      if (isStoped && element) {
        tickerScale.setAttribute(attributes$j.stop, '');
        tickerScale.querySelectorAll(selectors$u.tickerText).forEach((textHolder) => {
          textHolder.classList.remove(classes$r.tickerAnimated);
          textHolder.style.transform = `translate3d(${-(element.offsetLeft - parseInt(getComputedStyle(element).marginLeft, 10))}px, 0, 0)`;
        });
      }

      if (!isStoped && element) {
        tickerScale.querySelectorAll(selectors$u.tickerText).forEach((textHolder) => {
          textHolder.classList.add(classes$r.tickerAnimated);
          textHolder.removeAttribute(attributes$j.style);
        });
        tickerScale.removeAttribute(attributes$j.stop);
      }
    }

    onBlockSelect(evt) {
      const index = parseInt([...evt.target.parentNode.children].indexOf(evt.target));

      if (this.slider && this.flkty !== null) {
        this.flkty.select(index);
        this.flkty.pausePlayer();
      }
      if (!this.slider) {
        this.toggleTicker(evt, true);
      }
    }

    onBlockDeselect(evt) {
      if (this.slider && this.flkty !== null) {
        this.flkty.unpausePlayer();
      }
      if (!this.slider) {
        this.toggleTicker(evt, false);
      }
    }

    onUnload() {
      document.removeEventListener('theme:resize:width', this.initSlider.bind(this));
    }
  }

  const bar = {
    onLoad() {
      sections$5[this.id] = [];
      const element = this.container.querySelector(selectors$u.bar);
      if (element) {
        sections$5[this.id].push(new AnnouncementBar(element));
      }
    },
    onBlockSelect(e) {
      if (sections$5[this.id].length) {
        sections$5[this.id].forEach((el) => {
          if (typeof el.onBlockSelect === 'function') {
            el.onBlockSelect(e);
          }
        });
      }
    },
    onBlockDeselect(e) {
      if (sections$5[this.id].length) {
        sections$5[this.id].forEach((el) => {
          if (typeof el.onBlockSelect === 'function') {
            el.onBlockDeselect(e);
          }
        });
      }
    },
  };

  register('announcement-bar', bar);
  register('marquee', bar);

  const selectors$v = {
    trigger: '[data-collapsible-trigger]',
  };

  const classes$s = {
    isExpanded: 'is-expanded',
  };

  const accordionSection = {
    onBlockSelect(e) {
      const trigger = e.target.querySelector(selectors$v.trigger);
      if (!trigger.classList.contains(classes$s.isExpanded)) {
        trigger.dispatchEvent(new Event('click'));
      }
    },
  };

  register('accordions', [accordionSection, collapsible]);

  const selectors$w = {
    button: '[data-share-button]',
    tooltip: '[data-share-button-tooltip]',
  };

  const classes$t = {
    visible: 'is-visible',
    hiding: 'is-hiding',
  };

  const sections$6 = {};

  class ShareButton {
    constructor(container) {
      this.container = container;
      this.button = this.container.querySelector(selectors$w.button);
      this.tooltip = this.container.querySelector(selectors$w.tooltip);
      this.transitionSpeed = 200;
      this.hideTransitionTimeout = 0;
      this.init();
    }

    init() {
      if (this.button) {
        this.button.addEventListener('click', () => {
          let targetUrl = window.location.href;
          if (this.button.dataset.shareLink) {
            targetUrl = this.button.dataset.shareLink;
          }

          if (!this.tooltip.classList.contains(classes$t.visible)) {
            navigator.clipboard.writeText(targetUrl).then(() => {
              this.tooltip.classList.add(classes$t.visible);
              setTimeout(() => {
                this.tooltip.classList.add(classes$t.hiding);
                this.tooltip.classList.remove(classes$t.visible);

                if (this.hideTransitionTimeout) {
                  clearTimeout(this.hideTransitionTimeout);
                }

                this.hideTransitionTimeout = setTimeout(() => {
                  this.tooltip.classList.remove(classes$t.hiding);
                }, this.transitionSpeed);
              }, 1500);
            });
          }
        });
      }
    }
  }

  const shareButton = {
    onLoad() {
      sections$6[this.id] = new ShareButton(this.container);
    },
  };

  register('article', [shareButton]);

  const selectors$x = {
    banner: '[data-banner]',
    slider: '[data-slider]',
    sliderMedia: '[data-banners-media]',
  };

  const attributes$k = {
    index: 'data-index',
    singleImage: 'data-slider-single-image',
  };

  let sections$7 = {};

  class BannerWithTextColumns {
    constructor(section) {
      this.container = section.container;
      this.slider = this.container.querySelector(selectors$x.slider);
      this.singleImageEnabled = this.slider.hasAttribute(attributes$k.singleImage);
      this.banners = this.container.querySelectorAll(selectors$x.banner);
      this.links = this.container.querySelectorAll('a');
      this.sliderMedia = this.container.querySelector(selectors$x.sliderMedia);
      this.flkty = null;
      this.flktyMedia = null;
      this.sliderResizeEvent = () => this.resizeSlider();

      this.initSliders();

      document.addEventListener('theme:resize:width', this.sliderResizeEvent);
    }

    initSliders() {
      if (this.slider.children.length <= 1) return;

      let isDraggable = window.innerWidth < window.theme.sizes.small;

      if (this.sliderMedia.children.length > 1) {
        this.flktyMedia = new Flickity(this.sliderMedia, {
          draggable: false,
          wrapAround: false,
          fade: true,
          prevNextButtons: false,
          adaptiveHeight: false,
          pageDots: false,
          setGallerySize: false,
        });

        flickitySmoothScrolling(this.sliderMedia);
      }

      this.flkty = new Flickity(this.slider, {
        draggable: isDraggable,
        prevNextButtons: false,
        pageDots: true,
        cellAlign: 'left',
        adaptiveHeight: false,
        imagesLoaded: true,
        lazyLoad: true,
        on: {
          ready: () => {
            this.links.forEach((link) => {
              link.addEventListener('focus', () => {
                const selectedIndex = Number(link.closest(selectors$x.banner).getAttribute(attributes$k.index));

                if (window.innerWidth >= theme.sizes.small) {
                  this.syncContent(selectedIndex);
                }
              });
            });

            this.banners.forEach((slide) => {
              slide.addEventListener('mouseenter', () => {
                const selectedIndex = Number(slide.getAttribute(attributes$k.index));

                if (window.innerWidth >= theme.sizes.small && !window.theme.touch) {
                  this.syncContent(selectedIndex);
                }
              });

              slide.addEventListener('pointerup', () => {
                const selectedIndex = Number(slide.getAttribute(attributes$k.index));

                if (window.innerWidth >= theme.sizes.small && window.theme.touch) {
                  this.syncContent(selectedIndex);
                }
              });
            });
          },
          change: (index) => {
            if (window.innerWidth < theme.sizes.small && !this.singleImageEnabled) {
              this.flktyMedia.select(index);
            }
          },
        },
      });

      flickitySmoothScrolling(this.slider);
    }

    syncContent(index = 0) {
      this.flkty.selectCell(index);

      if (this.flktyMedia) {
        this.flktyMedia.selectCell(index);
      }
    }

    resizeSlider() {
      if (this.flkty) {
        this.flkty.resize();
        this.toggleDraggable();
      }

      if (this.flktyMedia) {
        this.flktyMedia.resize();
      }
    }

    toggleDraggable() {
      this.flkty.options.draggable = window.innerWidth < window.theme.sizes.small;
      this.flkty.updateDraggable();
    }

    onBlockSelect(evt) {
      const selectedIndex = parseInt([...evt.target.parentNode.children].indexOf(evt.target));
      if (this.flktyMedia) {
        this.flktyMedia.selectCell(selectedIndex);
      }
    }

    onUnload() {
      document.removeEventListener('theme:resize:width', this.sliderResizeEvent);
    }
  }

  const BannerWithTextColumnsSection = {
    onLoad() {
      sections$7[this.id] = new BannerWithTextColumns(this);
    },
    onBlockSelect(e) {
      sections$7[this.id].onBlockSelect(e);
    },
  };

  register('banner-with-text-columns', BannerWithTextColumnsSection);

  register('blog-posts', ajaxify);

  const selectors$y = {
    videoPlay: '[data-video-play]',
  };

  const attributes$l = {
    videoPlayValue: 'data-video-play',
  };

  class VideoPlay {
    constructor(container) {
      this.container = container;
      this.videoPlay = this.container.querySelectorAll(selectors$y.videoPlay);
      this.a11y = a11y;

      this.init();
    }

    init() {
      if (this.videoPlay.length) {
        this.videoPlay.forEach((element) => {
          element.addEventListener('click', (e) => {
            if (element.hasAttribute(attributes$l.videoPlayValue) && element.getAttribute(attributes$l.videoPlayValue).trim() !== '') {
              e.preventDefault();

              const items = [
                {
                  html: element.getAttribute(attributes$l.videoPlayValue),
                },
              ];
              this.a11y.state.trigger = element;
              new LoadPhotoswipe(items);
            }
          });
        });
      }
    }
  }

  const videoPlay = {
    onLoad() {
      new VideoPlay(this.container);
    },
  };

  const selectors$z = {
    slider: '[data-slider]',
    sliderItem: '[data-slider-item]',
    sliderItemImage: '[data-media-container]',
    links: 'a, button',
    flickityButton: '.flickity-button',
  };

  const classes$u = {
    carouselInactive: 'carousel--inactive',
  };

  const attributes$m = {
    tabIndex: 'tabindex',
  };

  const sections$8 = {};

  class ColumnsWithImage {
    constructor(section) {
      this.container = section.container;
      this.slider = this.container.querySelector(selectors$z.slider);
      this.flkty = null;
      this.gutter = 0;
      this.checkSlidesSizeOnResize = () => this.checkSlidesSize();
      this.listen();
    }

    initSlider() {
      this.slider.classList.remove(classes$u.carouselInactive);

      this.flkty = new Flickity(this.slider, {
        pageDots: false,
        cellAlign: 'left',
        groupCells: true,
        contain: true,
        on: {
          ready: () => {
            this.setSliderArrowsPosition(this.slider);
            setTimeout(() => {
              this.changeTabIndex();
            }, 0);
          },
          change: () => {
            this.changeTabIndex();
          },
        },
      });
    }

    destroySlider() {
      this.slider.classList.add(classes$u.carouselInactive);

      if (this.flkty !== null) {
        this.flkty.destroy();
        this.flkty = null;
      }
    }

    checkSlidesSize() {
      const sliderItemStyle = this.container.querySelector(selectors$z.sliderItem).currentStyle || window.getComputedStyle(this.container.querySelector(selectors$z.sliderItem));
      this.gutter = parseInt(sliderItemStyle.marginRight);
      const containerWidth = this.slider.offsetWidth;
      const itemsWidth = this.getItemsWidth();
      const itemsOverflowViewport = containerWidth < itemsWidth;

      if (window.innerWidth >= theme.sizes.small && itemsOverflowViewport) {
        this.initSlider();
      } else {
        this.destroySlider();
      }
    }

    changeTabIndex() {
      const selectedElementsIndex = this.flkty.selectedIndex;

      this.flkty.slides.forEach((slide, index) => {
        slide.cells.forEach((cell) => {
          cell.element.querySelectorAll(selectors$z.links).forEach((link) => {
            link.setAttribute(attributes$m.tabIndex, selectedElementsIndex === index ? '0' : '-1');
          });
        });
      });
    }

    getItemsWidth() {
      let itemsWidth = 0;
      const slides = this.slider.querySelectorAll(selectors$z.sliderItem);
      if (slides.length) {
        slides.forEach((item) => {
          itemsWidth += item.offsetWidth + this.gutter;
        });
      }

      return itemsWidth;
    }

    listen() {
      if (this.slider) {
        this.checkSlidesSize();
        document.addEventListener('theme:resize:width', this.checkSlidesSizeOnResize);
      }
    }

    setSliderArrowsPosition(slider) {
      const arrows = slider.querySelectorAll(selectors$z.flickityButton);
      const image = slider.querySelector(selectors$z.sliderItemImage);

      if (arrows.length && image) {
        arrows.forEach((arrow) => {
          arrow.style.top = `${image.offsetHeight / 2}px`;
        });
      }
    }

    onBlockSelect(evt) {
      if (this.flkty !== null) {
        const index = parseInt([...evt.target.parentNode.children].indexOf(evt.target));
        const slidesPerPage = parseInt(this.flkty.slides[0].cells.length);
        const groupIndex = Math.floor(index / slidesPerPage);

        this.flkty.select(groupIndex);
      } else {
        const sliderStyle = this.slider.currentStyle || window.getComputedStyle(this.slider);
        const sliderPadding = parseInt(sliderStyle.paddingLeft);
        const blockPositionLeft = evt.target.offsetLeft - sliderPadding;

        // Native scroll to item
        this.slider.scrollTo({
          top: 0,
          left: blockPositionLeft,
          behavior: 'smooth',
        });
      }
    }

    onUnload() {
      document.removeEventListener('theme:resize:width', this.checkSlidesSizeOnResize);
    }
  }

  const ColumnsWithImageSection = {
    onLoad() {
      sections$8[this.id] = new ColumnsWithImage(this);
    },
    onUnload(e) {
      sections$8[this.id].onUnload(e);
    },
    onBlockSelect(e) {
      sections$8[this.id].onBlockSelect(e);
    },
  };

  register('columns-with-image', [ColumnsWithImageSection, videoPlay]);

  const selectors$A = {
    formMessageClose: '[data-form-message-close]',
    formMessageWrapper: '[data-form-message]',
  };

  const classes$v = {
    hideDown: 'hide-down',
    notificationVisible: 'notification-visible',
  };

  let sections$9 = {};

  class ContactForm {
    constructor(section) {
      this.container = section.container;
      this.closeButton = this.container.querySelector(selectors$A.formMessageClose);
      this.messageWrapper = this.container.querySelector(selectors$A.formMessageWrapper);

      if (this.messageWrapper) {
        this.hidePopups();
        this.closeFormMessage();
        this.autoHideMessage();
      }
    }

    hidePopups() {
      document.body.classList.add(classes$v.notificationVisible);
    }

    showPopups() {
      document.body.classList.remove(classes$v.notificationVisible);
    }

    closeFormMessage() {
      this.closeButton.addEventListener('click', this.closeMessage.bind(this));
    }

    closeMessage(e) {
      e.preventDefault();
      this.messageWrapper.classList.add(classes$v.hideDown);
      this.showPopups();
    }

    autoHideMessage() {
      setTimeout(() => {
        this.messageWrapper.classList.add(classes$v.hideDown);
        this.showPopups();
      }, 10000);
    }
  }

  const contactFormSection = {
    onLoad() {
      sections$9[this.id] = new ContactForm(this);
    },
  };

  register('contact-form', contactFormSection);

  class PopupCookie {
    constructor(name, value) {
      this.configuration = {
        expires: null, // session cookie
        path: '/',
        domain: window.location.hostname,
        sameSite: 'none',
        secure: true,
      };
      this.name = name;
      this.value = value;
    }

    write() {
      const hasCookie = document.cookie.indexOf('; ') !== -1 && !document.cookie.split('; ').find((row) => row.startsWith(this.name));
      if (hasCookie || document.cookie.indexOf('; ') === -1) {
        document.cookie = `${this.name}=${this.value}; expires=${this.configuration.expires}; path=${this.configuration.path}; domain=${this.configuration.domain}; sameSite=${this.configuration.sameSite}; secure=${this.configuration.secure}`;
      }
    }

    read() {
      if (document.cookie.indexOf('; ') !== -1 && document.cookie.split('; ').find((row) => row.startsWith(this.name))) {
        const returnCookie = document.cookie
          .split('; ')
          .find((row) => row.startsWith(this.name))
          .split('=')[1];

        return returnCookie;
      } else {
        return false;
      }
    }

    destroy() {
      if (document.cookie.split('; ').find((row) => row.startsWith(this.name))) {
        document.cookie = `${this.name}=null; expires=${this.configuration.expires}; path=${this.configuration.path}; domain=${this.configuration.domain}; sameSite=${this.configuration.sameSite}; secure=${this.configuration.secure}`;
      }
    }
  }

  const selectors$B = {
    newsletterForm: '[data-newsletter-form]',
    popup: '[data-popup]',
  };

  const classes$w = {
    success: 'has-success',
    error: 'has-error',
  };

  const attributes$n = {
    storageNewsletterFormId: 'newsletter_form_id',
  };

  const sections$a = {};

  class Newsletter {
    constructor(newsletter) {
      this.newsletter = newsletter;
      this.sessionStorage = window.sessionStorage;
      this.popup = this.newsletter.closest(selectors$B.popup);
      this.stopSubmit = true;
      this.isChallengePage = false;
      this.formID = null;
      this.formIdSuccess = null;

      this.checkForChallengePage();

      this.newsletterSubmit = (e) => this.newsletterSubmitEvent(e);

      if (!this.isChallengePage) {
        this.init();
      }
    }

    init() {
      this.newsletter.addEventListener('submit', this.newsletterSubmit);

      this.showMessage();
    }

    newsletterSubmitEvent(e) {
      if (this.stopSubmit) {
        e.preventDefault();

        this.removeStorage();
        this.writeStorage();
        this.stopSubmit = false;
        this.newsletter.submit();
      }
    }

    checkForChallengePage() {
      this.isChallengePage = window.location.pathname === theme.routes.root + 'challenge';
    }

    writeStorage() {
      if (this.sessionStorage !== undefined) {
        this.sessionStorage.setItem(attributes$n.storageNewsletterFormId, this.newsletter.id);
      }
    }

    readStorage() {
      this.formID = this.sessionStorage.getItem(attributes$n.storageNewsletterFormId);
    }

    removeStorage() {
      this.sessionStorage.removeItem(attributes$n.storageNewsletterFormId);
    }

    showMessage() {
      this.readStorage();

      if (this.newsletter.id === this.formID) {
        const newsletter = document.getElementById(this.formID);
        const submissionSuccess = window.location.search.indexOf('?customer_posted=true') !== -1;
        const submissionFailure = window.location.search.indexOf('accepts_marketing') !== -1;

        if (submissionSuccess) {
          newsletter.classList.remove(classes$w.error);
          newsletter.classList.add(classes$w.success);

          if (this.popup) {
            this.cookie = new PopupCookie(this.popup.dataset.cookieName, 'user_has_closed');
            this.cookie.write();
          }
        } else if (submissionFailure) {
          newsletter.classList.remove(classes$w.success);
          newsletter.classList.add(classes$w.error);
        }

        if (submissionSuccess || submissionFailure) {
          this.scrollToForm(newsletter);
        }
      }
    }

    /**
     * Scroll to the last submitted newsletter form
     */
    scrollToForm(newsletter) {
      const rect = newsletter.getBoundingClientRect();
      const isVisible = visibilityHelper.isElementPartiallyVisible(newsletter) || visibilityHelper.isElementTotallyVisible(newsletter);

      if (!isVisible) {
        setTimeout(() => {
          window.scrollTo({
            top: rect.top,
            left: 0,
            behavior: 'smooth',
          });
        }, 400);
      }
    }

    /**
     * Event callback for Theme Editor `section:unload` event
     */
    onUnload() {
      this.newsletter.removeEventListener('submit', this.newsletterSubmit);
    }
  }

  const newsletterSection = {
    onLoad() {
      sections$a[this.id] = [];
      const newsletters = this.container.querySelectorAll(selectors$B.newsletterForm);
      newsletters.forEach((form) => {
        sections$a[this.id].push(new Newsletter(form));
      });
    },
    onUnload() {
      sections$a[this.id].forEach((form) => {
        if (typeof form.onUnload === 'function') {
          form.onUnload();
        }
      });
    },
  };

  const selectors$C = {
    product: '[data-product]',
    productSlider: '[data-slider]',
    productSlide: '[data-slide]',
    productGridItemImage: '[data-product-media-container]',
    flickityButton: '.flickity-button',
    item: '[data-slide]',
    links: 'a, button',
  };

  const attributes$o = {
    tabIndex: 'tabindex',
  };

  const sections$b = {};

  class CustomContent {
    constructor(container) {
      this.container = container;
      this.product = this.container.querySelectorAll(selectors$C.product);
      this.productSlider = this.container.querySelectorAll(selectors$C.productSlider);
      this.checkSliderOnResize = () => this.checkSlider();
      this.flkty = [];
      this.videoObj = [];
      this.quickViewObj = [];

      this.listen();
    }

    checkSlider() {
      if (window.innerWidth >= theme.sizes.small) {
        this.productSlider.forEach((slider) => {
          this.initProductSlider(slider);
        });
      } else {
        this.productSlider.forEach((slider) => {
          this.destroyProductSlider(slider);
        });
      }
    }

    initProductSlider(slider) {
      const slidesCount = slider.querySelectorAll(selectors$C.productSlide).length;
      const sliderId = slider.dataset.slider;

      if (slidesCount > 1) {
        if (this.flkty[sliderId] === undefined || !this.flkty[sliderId].isActive) {
          this.flkty[sliderId] = new Flickity(slider, {
            prevNextButtons: true,
            pageDots: true,
            wrapAround: true,
            on: {
              ready: () => {
                this.setSliderArrowsPosition(slider);
              },
              change: (index) => {
                this.flkty[sliderId].cells.forEach((slide, i) => {
                  slide.element.querySelectorAll(selectors$C.links).forEach((link) => {
                    link.setAttribute(attributes$o.tabIndex, i === index ? '0' : '-1');
                  });
                });
              },
            },
          });
        } else {
          this.setSliderArrowsPosition(slider);
        }
      }
    }

    destroyProductSlider(slider) {
      const sliderId = slider.dataset.slider;

      if (typeof this.flkty[sliderId] === 'object') {
        this.flkty[sliderId].destroy();
      }
    }

    setSliderArrowsPosition(slider) {
      const arrows = slider.querySelectorAll(selectors$C.flickityButton);
      const image = slider.querySelector(selectors$C.productGridItemImage);

      if (arrows.length && image) {
        arrows.forEach((arrow) => {
          arrow.style.top = `${image.offsetHeight / 2}px`;
        });
      }
    }

    listen() {
      this.checkSlider();
      document.addEventListener('theme:resize:width', this.checkSliderOnResize);
    }

    onUnload() {
      if (this.flkty) {
        for (const key in this.flkty) {
          if (this.flkty.hasOwnProperty(key)) {
            this.flkty[key].destroy();
          }
        }
      }

      document.removeEventListener('theme:resize:width', this.checkSliderOnResize);
    }
  }

  const CustomContentSection = {
    onLoad() {
      sections$b[this.id] = new CustomContent(this.container);
    },
    onUnload(e) {
      sections$b[this.id].onUnload(e);
    },
  };

  register('custom-content', [CustomContentSection, newsletterSection, videoPlay, productGrid]);

  const selectors$D = {
    slider: '[data-slider]',
    sliderItem: '[data-slide]',
    productGridItemImage: '[data-product-media-container]',
    links: 'a, button',
    flickityButton: '.flickity-button',
  };

  const classes$x = {
    carouselInactive: 'carousel--inactive',
  };

  const attributes$p = {
    sliderId: 'data-slider-id',
    showImage: 'data-slider-show-image',
    tabIndex: 'tabindex',
  };

  const sections$c = {};

  class GridSlider {
    constructor(container) {
      this.container = container;
      this.columns = parseInt(this.container.dataset.columns);
      this.sliders = this.container.querySelectorAll(selectors$D.slider);
      this.checkSlidesSizeOnResize = () => this.checkSlidesSize();
      this.resetSliderEvent = (e) => this.resetSlider(e);
      this.flkty = [];
      this.listen();
    }

    initSlider(slider) {
      const sliderId = slider.getAttribute(attributes$p.sliderId);
      slider.classList.remove(classes$x.carouselInactive);

      if (this.flkty[sliderId] === undefined || !this.flkty[sliderId].isActive) {
        this.flkty[sliderId] = new Flickity(slider, {
          pageDots: false,
          cellSelector: selectors$D.sliderItem,
          cellAlign: 'left',
          groupCells: true,
          contain: true,
          wrapAround: false,
          adaptiveHeight: false,
          on: {
            ready: () => {
              this.setSliderArrowsPosition(slider);
              setTimeout(() => {
                this.changeTabIndex(slider);
              }, 0);
            },
            change: () => {
              this.changeTabIndex(slider);
            },
          },
        });
      } else {
        this.setSliderArrowsPosition(slider);
      }
    }

    destroySlider(slider) {
      const sliderId = slider.getAttribute(attributes$p.sliderId);
      slider.classList.add(classes$x.carouselInactive);

      if (typeof this.flkty[sliderId] === 'object') {
        this.flkty[sliderId].destroy();
      }
    }

    // Move slides to their initial position
    resetSlider(e) {
      const slider = e.target;
      const sliderId = slider.getAttribute(attributes$p.sliderId);

      if (typeof this.flkty[sliderId] === 'object') {
        this.flkty[sliderId].select(0, false, true);
      } else {
        slider.scrollTo({
          left: 0,
          behavior: 'instant',
        });
      }
    }

    checkSlidesSize() {
      if (this.sliders.length) {
        this.sliders.forEach((slider) => {
          const columns = this.columns;
          const isDesktop = window.innerWidth >= theme.sizes.large;
          const isTablet = window.innerWidth >= theme.sizes.small && window.innerWidth < theme.sizes.large;
          let itemsCount = slider.querySelectorAll(selectors$D.sliderItem).length;

          // If tab collection has show image enabled
          if (slider.hasAttribute(attributes$p.showImage)) {
            itemsCount += 1;
          }

          if ((isDesktop && itemsCount > columns) || (isTablet && itemsCount > 2)) {
            this.initSlider(slider);
          } else {
            this.destroySlider(slider);
          }
        });
      }
    }

    changeTabIndex(slider) {
      const sliderId = slider.getAttribute(attributes$p.sliderId);
      const selectedElementsIndex = this.flkty[sliderId].selectedIndex;

      this.flkty[sliderId].slides.forEach((slide, index) => {
        slide.cells.forEach((cell) => {
          cell.element.querySelectorAll(selectors$D.links).forEach((link) => {
            link.setAttribute(attributes$p.tabIndex, selectedElementsIndex === index ? '0' : '-1');
          });
        });
      });
    }

    setSliderArrowsPosition(slider) {
      const arrows = slider.querySelectorAll(selectors$D.flickityButton);
      const image = slider.querySelector(selectors$D.productGridItemImage);

      if (arrows.length && image) {
        arrows.forEach((arrow) => {
          arrow.style.top = `${image.offsetHeight / 2}px`;
        });
      }
    }

    listen() {
      if (this.sliders.length) {
        this.checkSlidesSize();
        document.addEventListener('theme:resize:width', this.checkSlidesSizeOnResize);

        this.sliders.forEach((slider) => {
          slider.addEventListener('theme:tab:change', this.resetSliderEvent);
        });
      }
    }

    /**
     * Event callback for Theme Editor `section:block:select` event
     */
    onBlockSelect(evt) {
      const slider = evt.target.closest(selectors$D.slider);
      const flkty = Flickity.data(slider) || null;

      if (!slider) {
        return;
      }

      if (flkty !== null && flkty.isActive) {
        const index = parseInt([...evt.target.parentNode.children].indexOf(evt.target));
        const slidesPerPage = parseInt(flkty.slides[0].cells.length);
        const groupIndex = Math.floor(index / slidesPerPage);

        flkty.select(groupIndex);
      } else {
        const sliderStyle = slider.currentStyle || window.getComputedStyle(slider);
        const sliderPadding = parseInt(sliderStyle.paddingLeft);
        const blockPositionLeft = evt.target.offsetLeft - sliderPadding;

        // Native scroll to item
        slider.scrollTo({
          top: 0,
          left: blockPositionLeft,
          behavior: 'smooth',
        });
      }
    }

    /**
     * Event callback for Theme Editor `section:unload` event
     */
    onUnload() {
      if (this.flkty) {
        for (const key in this.flkty) {
          if (this.flkty.hasOwnProperty(key)) {
            this.flkty[key].destroy();
          }
        }
      }

      document.removeEventListener('theme:resize:width', this.checkSlidesSizeOnResize);

      if (this.sliders.length) {
        this.sliders.forEach((slider) => {
          slider.removeEventListener('theme:tab:change', this.resetSliderEvent);
        });
      }
    }
  }

  const gridSlider = {
    onLoad() {
      sections$c[this.id] = [];
      const els = this.container.querySelectorAll(selectors$D.slider);
      els.forEach((el) => {
        sections$c[this.id].push(new GridSlider(this.container));
      });
    },
    onUnload() {
      sections$c[this.id].forEach((el) => {
        if (typeof el.onUnload === 'function') {
          el.onUnload();
        }
      });
    },
    onBlockSelect(e) {
      sections$c[this.id].forEach((el) => {
        if (typeof el.onBlockSelect === 'function') {
          el.onBlockSelect(e);
        }
      });
    },
  };

  register('featured-collection', [productGrid, gridSlider]);

  register('featured-video', videoPlay);

  const selectors$E = {
    trigger: '[data-collapsible-trigger-mobile]',
  };

  const classes$y = {
    isExpanded: 'is-expanded',
  };

  const footerAccordionSection = {
    onBlockSelect(e) {
      const trigger = e.target.querySelector(selectors$E.trigger);
      if (trigger && !trigger.classList.contains(classes$y.isExpanded)) {
        trigger.dispatchEvent(new Event('click'));
      }
    },
    onBlockDeselect(e) {
      const trigger = e.target.querySelector(selectors$E.trigger);
      if (trigger && trigger.classList.contains(classes$y.isExpanded)) {
        trigger.dispatchEvent(new Event('click'));
      }
    },
  };

  register('footer', [popoutSection, newsletterSection, collapsible, footerAccordionSection]);

  const selectors$F = {
    disclosureWrappper: '[data-hover-disclosure]',
    header: '[data-site-header]',
    link: '[data-top-link]',
    headerBackground: '[data-header-background]',
  };

  const classes$z = {
    isVisible: 'is-visible',
    grandparent: 'grandparent',
    headerMenuOpened: 'site-header--menu-opened',
    hasScrolled: 'has-scrolled',
  };

  const attributes$q = {
    disclosureToggle: 'data-hover-disclosure-toggle',
    ariaHasPopup: 'aria-haspopup',
    ariaExpanded: 'aria-expanded',
    ariaControls: 'aria-controls',
  };

  let sections$d = {};

  class HoverDisclosure {
    constructor(el) {
      this.disclosure = el;
      this.header = el.closest(selectors$F.header);
      this.key = this.disclosure.id;
      this.trigger = document.querySelector(`[${attributes$q.disclosureToggle}='${this.key}']`);
      this.link = this.trigger.querySelector(selectors$F.link);
      this.grandparent = this.trigger.classList.contains(classes$z.grandparent);
      this.background = document.querySelector(selectors$F.headerBackground);
      this.trigger.setAttribute(attributes$q.ariaHasPopup, true);
      this.trigger.setAttribute(attributes$q.ariaExpanded, false);
      this.trigger.setAttribute(attributes$q.ariaControls, this.key);
      this.dropdown = this.trigger.querySelector(selectors$F.disclosureWrappper);

      this.connectHoverToggle();
      this.handleTablets();
    }

    showDisclosure() {
      this.hasScrolled = document.body.classList.contains(classes$z.hasScrolled);
      this.headerHeight = this.hasScrolled ? window.hasScrolledHeaderHeight : this.header.offsetHeight;

      if (this.grandparent) {
        this.dropdown.style.height = 'auto';
        this.dropdownHeight = this.dropdown.offsetHeight;
      } else {
        this.dropdownHeight = this.headerHeight;
      }

      this.background.style.setProperty('--header-background-height', `${this.dropdownHeight}px`);

      // Set accessibility and classes
      this.trigger.setAttribute(attributes$q.ariaExpanded, true);
      this.trigger.classList.add(classes$z.isVisible);
      this.header.classList.add(classes$z.headerMenuOpened);
    }

    hideDisclosure() {
      this.background.style.removeProperty('--header-background-height');

      this.trigger.classList.remove(classes$z.isVisible);
      this.trigger.setAttribute(attributes$q.ariaExpanded, false);
      this.header.classList.remove(classes$z.headerMenuOpened);
    }

    handleTablets() {
      // first click opens the popup, second click opens the link
      this.trigger.addEventListener('touchstart', (e) => {
        const isOpen = this.trigger.classList.contains(classes$z.isVisible);
        if (!isOpen) {
          e.preventDefault();
          this.showDisclosure();
        }
      });
    }

    connectHoverToggle() {
      this.trigger.addEventListener('mouseenter', () => this.showDisclosure());
      this.link.addEventListener('focus', () => this.showDisclosure());

      this.trigger.addEventListener('mouseleave', () => this.hideDisclosure());
      this.trigger.addEventListener('focusout', (e) => {
        const inMenu = this.trigger.contains(e.relatedTarget);
        if (!inMenu) {
          this.hideDisclosure();
        }
      });
      this.disclosure.addEventListener('keyup', (evt) => {
        if (evt.which !== theme.keyboardKeys.ESCAPE) {
          return;
        }
        this.hideDisclosure();
      });
    }

    onBlockSelect(evt) {
      if (this.disclosure.contains(evt.target)) {
        this.showDisclosure(evt);
      }
    }

    onBlockDeselect(evt) {
      if (this.disclosure.contains(evt.target)) {
        this.hideDisclosure();
      }
    }
  }

  const hoverDisclosure = {
    onLoad() {
      sections$d[this.id] = [];
      const disclosures = this.container.querySelectorAll(selectors$F.disclosureWrappper);

      disclosures.forEach((el) => {
        sections$d[this.id].push(new HoverDisclosure(el));
      });
    },
    onBlockSelect(evt) {
      sections$d[this.id].forEach((el) => {
        if (typeof el.onBlockSelect === 'function') {
          el.onBlockSelect(evt);
        }
      });
    },
    onBlockDeselect(evt) {
      sections$d[this.id].forEach((el) => {
        if (typeof el.onBlockDeselect === 'function') {
          el.onBlockDeselect(evt);
        }
      });
    },
  };

  const bgset = (image, imageAspectRatio) => {
    let bgset = '';
    const blankImageAspectRatio = 1;

    if (image.indexOf('no-image') != -1 && image.indexOf('2048x.gif') != -1) {
      imageAspectRatio = blankImageAspectRatio;
    }

    bgset += image.replace('_2048x.', '_180x.') + ' 180w ' + Math.round(180 / imageAspectRatio) + 'h,';
    bgset += image.replace('_2048x.', '_360x.') + ' 360w ' + Math.round(360 / imageAspectRatio) + 'h,';
    bgset += image.replace('_2048x.', '_540x.') + ' 540w ' + Math.round(540 / imageAspectRatio) + 'h,';
    bgset += image.replace('_2048x.', '_720x.') + ' 720w ' + Math.round(720 / imageAspectRatio) + 'h,';
    bgset += image.replace('_2048x.', '_900x.') + ' 900w ' + Math.round(900 / imageAspectRatio) + 'h,';
    bgset += image.replace('_2048x.', '_1080x.') + ' 1080w ' + Math.round(1080 / imageAspectRatio) + 'h,';
    bgset += image.replace('_2048x.', '_1296x.') + ' 1296w ' + Math.round(1296 / imageAspectRatio) + 'h,';
    bgset += image.replace('_2048x.', '_1512x.') + ' 1512w ' + Math.round(1512 / imageAspectRatio) + 'h,';
    bgset += image.replace('_2048x.', '_1728x.') + ' 1728w ' + Math.round(1728 / imageAspectRatio) + 'h,';
    bgset += image.replace('_2048x.', '_1950x.') + ' 1950w ' + Math.round(1950 / imageAspectRatio) + 'h,';
    bgset += image + ' 2048w ' + Math.round(2048 / imageAspectRatio) + 'h';

    return bgset;
  };

  function formatPrices(product) {
    const onSale = product.price <= product.compare_at_price_min;
    const soldOut = !product.available;
    const showSoldOut = theme.settings.showSoldBadge;
    const showSale = theme.settings.showSaleBadge;
    const showSavingBadge = theme.settings.showSavingBadge;
    const savingBadgeType = theme.settings.savingBadgeType;
    let soldBadgeText = false;
    let saleBadgeText = false;
    let savingBadgeText = false;
    let price = product.price;
    let priceCompare = product.compare_at_price;
    let priceDifference = priceCompare - price;

    // Custom and Preorder badges
    if (showSavingBadge && !pairProduct) {
      if (product.variants.length > 1) {
        product.variants.forEach((variant) => {
          const variantPriceDifference = variant.compare_at_price - variant.price;

          if (variantPriceDifference > priceDifference) {
            priceDifference = variantPriceDifference;
            price = variant.price;
            priceCompare = variant.compare_at_price;
          }
        });
      }

      if (priceDifference > 0) {
        if (savingBadgeType === 'percentage') {
          price = `${Math.round(((-(price / priceCompare) + 1) * 100).toFixed(2))}%`;
        } else {
          price = themeCurrency.formatMoney(priceDifference, theme.moneyFormat);
        }

        savingBadgeText = theme.strings.saving_badge.replace('{{ discount }}', price);

        if (product.variants.length > 1) {
          savingBadgeText = theme.strings.saving_up_to_badge.replace('{{ discount }}', price);
        }
      }
    }

    // Sold out badge
    if (showSoldOut && soldOut) {
      soldBadgeText = theme.strings.sold_out;
    }

    // Sale badge
    if (showSale && onSale && !soldOut && !savingBadgeText) {
      saleBadgeText = theme.strings.sale_badge_text;
    }

    const formatted = {
      ...product,
      soldBadgeText,
      saleBadgeText,
      savingBadgeText,
      compare_at_price_max: themeCurrency.formatMoney(product.compare_at_price_max, theme.moneyFormat),
      compare_at_price_min: themeCurrency.formatMoney(product.compare_at_price_min, theme.moneyFormat),
      price_max: themeCurrency.formatMoney(product.price_max, theme.moneyFormat),
      price_min: themeCurrency.formatMoney(product.price_min, theme.moneyFormat),
      unit_price: themeCurrency.formatMoney(product.unit_price, theme.moneyFormat),
    };

    return formatted;
  }

  const selectors$G = {
    body: 'body',
    header: '[data-site-header]',
    search: '[data-nav-search]',
    searchOpen: '[data-nav-search-open]',
    searchClose: '[data-nav-search-close]',
    searchForm: '[data-nav-search-form]',
    searchContainer: '[data-nav-search-container]',
    searchScroller: '[data-nav-search-scroller]',
    searchResultsContainer: '[data-nav-search-results]',
    searchInput: '[data-nav-search-input]',
    popularSearchLink: '[data-popular-search-link]',
    productTemplate: '[product-grid-item-template]',
    productsWrapper: '[data-products-wrap]',
    noresultTemplate: '[noresult-item-template]',
    resultsPagination: '[data-results-pagination]',
    navItem: '[data-nav-item]',
  };
  const classes$A = {
    pushUp: 'push-up',
    cartDrawerOpen: 'js-drawer-open-cart',
    drawerOpen: 'js-drawer-open',
    isSearching: 'is-searching',
    isSearchVisible: 'is-search-visible',
    navSearchIsVisible: 'nav-search--is-visible',
    loading: 'loading',
    isPaginationVisible: 'is-pagination-visible',
    isVisible: 'is-visible',
    noOutline: 'no-outline',
  };

  let sections$e = {};

  class NavSearch {
    constructor(container) {
      this.container = container;
      this.searchInput = this.container.querySelector(selectors$G.searchInput);
      this.searchClose = this.container.querySelector(selectors$G.searchClose);
      this.searchContainer = this.container.querySelector(selectors$G.searchContainer);
      this.popularLinks = this.container.querySelectorAll(selectors$G.popularSearchLink);
      this.scrollableElement = this.container.querySelector(selectors$G.searchScroller);
      this.searchResultsContainer = this.container.querySelector(selectors$G.searchResultsContainer);
      this.searchForm = this.container.querySelector(selectors$G.searchForm);
      this.resultsPagination = this.container.querySelector(selectors$G.resultsPagination);

      this.productTemplate = document.querySelector(selectors$G.productTemplate).innerHTML;
      this.productsWrapper = document.querySelector(selectors$G.productsWrapper);
      this.noresultTemplate = document.querySelector(selectors$G.noresultTemplate).innerHTML;

      this.searchOpen = document.querySelectorAll(selectors$G.searchOpen);
      this.bodySelector = document.querySelector(selectors$G.body);
      this.headerSelector = document.querySelector(selectors$G.header);

      this.result = null;
      this.openSearchTimeout = 0;
      this.linkOpened = null;
      this.a11y = a11y;

      this.init();
    }

    init() {
      this.initListeners();
      this.initSearch();
    }

    initSearch() {
      this.searchInput.addEventListener(
        'input',
        debounce((event) => {
          const val = event.target.value;
          if (val && val.length > 1) {
            this.searchContainer.classList.add(classes$A.isSearching, classes$A.pushUp);
            this.fetchProductSuggestions(val);
          } else {
            this.reset();
          }
        }, 300)
      );
      this.searchInput.addEventListener('clear', this.reset.bind(this));
    }

    initListeners() {
      this.container.addEventListener('keyup', (e) => {
        if (e.keyCode === theme.keyboardKeys.ESCAPE) {
          e.stopImmediatePropagation();
          this.close();
        }
      });

      this.searchOpen.forEach((searchButton) => {
        searchButton.addEventListener('click', (e) => {
          e.preventDefault();
          this.open();
          this.linkOpened = e.target;
        });
      });

      this.searchClose.addEventListener('click', (e) => {
        e.preventDefault();
        this.close();
      });

      this.popularLinks.forEach((popularLink) => {
        popularLink.addEventListener('click', (e) => {
          e.preventDefault();
          const searchText = e.target.textContent;
          this.searchInput.value = searchText;
          window.location.href = `${theme.routes.search_url}?type=product&q=${searchText}&options[prefix]=last`;
        });
      });

      return this.linkOpened;
    }

    open() {
      const isNavDrawerOpen = this.bodySelector.classList.contains(classes$A.drawerOpen);
      const isCartDrawerOpen = this.bodySelector.classList.contains(classes$A.cartDrawerOpen);

      if (isNavDrawerOpen || isCartDrawerOpen) {
        if (typeof window.drawer.close === 'function') {
          window.drawer.close();
        }

        if (this.openSearchTimeout) {
          clearTimeout(this.openSearchTimeout);
        }
        this.openSearchTimeout = setTimeout(this.openSearch.bind(this), 400);
      } else {
        this.openSearch();
      }
    }

    openSearch() {
      const activeNavItem = this.headerSelector.querySelector(`.${classes$A.isVisible}${selectors$G.navItem}`);

      this.headerSelector.classList.add(classes$A.isSearchVisible);
      this.container.classList.add(classes$A.navSearchIsVisible);

      document.dispatchEvent(new CustomEvent('theme:search:open', {bubbles: true}));

      document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: this.scrollableElement}));

      setTimeout(() => {
        // Fixes hover issues on touch devices
        if (activeNavItem) {
          activeNavItem.dispatchEvent(new Event('mouseleave', {bubbles: true}));
        }

        this.a11y.trapFocus({
          container: this.container,
          elementToFocus: this.searchInput,
        });
      }, 100);
    }

    close() {
      const isSearchVisible = this.headerSelector.classList.contains(classes$A.isSearchVisible);
      const isFocusEnabled = !document.body.classList.contains(classes$A.noOutline);

      if (!isSearchVisible) {
        return;
      }

      this.reset();

      this.headerSelector.classList.remove(classes$A.isSearchVisible);
      this.container.classList.remove(classes$A.navSearchIsVisible);

      // Hook for navSearch close event
      document.dispatchEvent(new CustomEvent('theme:search:close', {bubbles: true}));

      if (isFocusEnabled) {
        this.a11y.removeTrapFocus({
          container: this.container,
        });

        setTimeout(() => {
          this.a11y.trapFocus({
            container: this.headerSelector,
            elementToFocus: this.linkOpened,
          });
        }, 100);
      }

      setTimeout(() => {
        document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));
      }, 250);
    }

    reset(clearTerms = true) {
      this.productsWrapper.innerHTML = '';
      this.searchInput.val = '';
      this.a11y.removeTrapFocus();

      if (clearTerms) {
        this.searchContainer.classList.remove([classes$A.isSearching, classes$A.pushUp]);
        this.searchResultsContainer.classList.remove(classes$A.isPaginationVisible);
      }
    }

    fetchProductSuggestions(terms) {
      fetch(`/search/suggest.json?q=${encodeURIComponent(terms)}&resources[type]=product&resources[limit]=10&resources[options][unavailable_products]=last`)
        .then(this.handleErrors)
        .then((response) => response.json())
        .then((response) => {
          this.result = response.resources.results;

          return this.fetchProducts(this.result.products);
        })
        .then((response) => {
          this.productsWrapper.innerHTML = '';
          this.searchResultsContainer.classList.remove(classes$A.isPaginationVisible);

          if (response === '') {
            this.injectHTML(this.productsWrapper, this.renderNoResult());
          } else {
            this.injectHTML(this.productsWrapper, response);

            if (this.result.products.length > 9) {
              this.resultsPagination.getElementsByTagName('a')[0].href = `${theme.routes.search_url}?type=product&q=${terms}&options[prefix]=last`;
              this.searchResultsContainer.classList.add(classes$A.isPaginationVisible);
            }

            this.a11y.removeTrapFocus({
              container: this.container,
            });
            this.a11y.trapFocus({
              container: this.container,
              elementToFocus: this.searchInput,
            });
          }

          this.searchContainer.classList.remove(classes$A.isSearching);
        })
        .catch((e) => {
          console.error(e);
        });
    }

    injectHTML(target, pageHTML) {
      target.innerHTML += pageHTML;
    }

    renderNoResult() {
      const text = theme.strings.no_results;

      const updateValues = {
        text,
      };

      return Sqrl.render(this.noresultTemplate, {item: updateValues});
    }

    fetchProducts(products) {
      const promises = [];
      products.forEach((product) => {
        // because of a translation bug in the predictive search API
        // we need to fetch the product JSON from the handle
        promises.push(
          fetchProduct(product.handle).then((productJSON) => {
            const formatted = formatPrices(productJSON);
            return this.renderProduct(formatted);
          })
        );
      });

      return Promise.all(promises).then((result) => {
        let str = '';
        result.forEach((render) => {
          str += render;
        });
        return str;
      });
    }

    renderProduct(product) {
      const stripHtmlRegex = /(<([^>]+)>)/gi;
      const title = product.title.replace(stripHtmlRegex, '');
      let media = null;
      let image = '';

      if (product.media !== undefined) {
        media = product.media[0];
      }

      if (media) {
        let layout = false;

        if (theme.settings.gridImageSize == 'contain') {
          layout = media.preview_image.aspect_ratio > theme.settings.gridImageAspectRatio ? 'landscape' : 'portrait';
        }

        image = {
          thumb: bgset(getSizedImageUrl(media.preview_image.src, '2048x'), media.preview_image.aspect_ratio),
          aspectRatio: media.preview_image.aspect_ratio,
          layout: layout,
        };
      } else {
        image = {
          thumb: theme.assets.no_image,
          alt: '',
          aspectRatio: 1,
        };
      }

      const updateValues = {
        ...product,
        title,
        image,
      };

      return Sqrl.render(this.productTemplate, {product: updateValues});
    }

    handleErrors(response) {
      if (!response.ok) {
        return response.json().then(function (json) {
          const e = new FetchError({
            status: response.statusText,
            headers: response.headers,
            json: json,
          });
          throw e;
        });
      }
      return response;
    }
  }

  const navSearch = {
    onLoad() {
      sections$e[this.id] = [];
      const navSearchs = document.querySelectorAll(selectors$G.search);

      navSearchs.forEach((search) => {
        sections$e[this.id].push(new NavSearch(search));
      });
    },
  };

  const selectors$H = {
    header: '[data-site-header]',
    announcementBar: '[data-announcement-wrapper]',
    collectionFilters: '[data-collection-filters]',
    logo: '[data-logo]',
    mobileNavDropdownTrigger: '[data-collapsible-trigger]',
    nav: '[data-nav]',
    navIcons: '[data-nav-icons]',
    navItem: '[data-nav-item]',
    navLinkMobile: '[data-nav-link-mobile]',
    wrapper: '[data-wrapper]',
    headerBackground: '[data-header-background]',
  };

  const classes$B = {
    jsDrawerOpenAll: ['js-drawer-open', 'js-drawer-open-cart', 'js-quick-view-visible'],
    headerTransparent: 'site-header--transparent',
    headerLoading: 'site-header--loading',
    headerHovered: 'site-header--hovered',
    headerMenuOpened: 'site-header--menu-opened',
    hasScrolled: 'has-scrolled',
    hideHeader: 'hide-header',
    navCompress: 'nav--compress',
    headerSticky: 'header--sticky',
    isVisible: 'is-visible',
    noOutline: 'no-outline',
  };

  const sections$f = {};

  class Header {
    constructor(container) {
      this.container = container;
      this.background = document.querySelector(selectors$H.headerBackground);
      this.header = container;
      this.headerSection = container.parentNode;
      this.headerWrapper = container.querySelector(selectors$H.wrapper);
      this.logo = container.querySelector(selectors$H.logo);
      this.nav = container.querySelector(selectors$H.nav);
      this.navIcons = container.querySelector(selectors$H.navIcons);
      this.headerStateEvent = (event) => this.headerState(event);
      this.updateBackgroundHeightEvent = (event) => this.updateBackgroundHeight(event);
      this.hasScrolled = false;
      this.hasCollectionFilters = document.querySelector(selectors$H.collectionFilters);

      initTransparentHeader();
      setMainSpacing();

      this.controlNav();
      this.initMobileNav();

      window.addEventListener('load', this.controlNav.bind(this));
      document.addEventListener('theme:resize:width', this.controlNav.bind(this));

      if (!this.hasCollectionFilters) {
        this.initStickyHeader();
      } else {
        this.header.classList.remove(classes$B.headerLoading);
      }

      this.handleBackgroundEvents();

      window.cart = new CartDrawer();
      window.drawer = new Drawer();
    }

    initStickyHeader() {
      this.position = this.header.dataset.position;

      if (this.position === 'fixed') {
        this.headerSection.classList.add(classes$B.headerSticky);
      } else {
        this.headerSection.classList.remove(classes$B.headerSticky);
      }

      this.header.classList.remove(classes$B.headerLoading);
      this.headerState();
      document.addEventListener('theme:scroll', this.headerStateEvent);
    }

    // Switch to "compact" header on scroll
    headerState(event) {
      const headerHeight = parseInt(this.header.dataset.height || this.header.offsetHeight);
      const announcementBar = document.querySelector(selectors$H.announcementBar);
      const announcementHeight = announcementBar ? announcementBar.offsetHeight : 0;
      const pageOffset = headerHeight + announcementHeight;
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollUp = event && event.detail && event.detail.up;
      let tempHeight = headerHeight;

      if (this.position === 'fixed') {
        // Show compact header when scroll down
        if (currentScrollTop > pageOffset) {
          document.body.classList.add(classes$B.hasScrolled);
          this.hasScrolled = true;
          this.header.classList.remove(classes$B.headerTransparent);
          tempHeight = window.hasScrolledHeaderHeight;
        } else {
          document.body.classList.remove(classes$B.hasScrolled);
          this.hasScrolled = false;
          tempHeight = headerHeight;

          if (window.isHeaderTransparent) {
            this.header.classList.add(classes$B.headerTransparent);
          }
        }

        if (document.documentElement.style.getPropertyValue('--header-height') !== `${tempHeight}px`) {
          document.documentElement.style.setProperty('--header-height', `${tempHeight}px`);
        }

        // Hide compact header when scroll back to top
        if (currentScrollTop < pageOffset && scrollUp) {
          document.body.classList.add(classes$B.hideHeader);
        } else {
          document.body.classList.remove(classes$B.hideHeader);
        }

        // Update header background height if users scroll the page with their mouse over the header or over an opened nav menu
        if (this.header.classList.contains(classes$B.headerHovered)) {
          this.background.style.setProperty('--header-background-height', `${tempHeight}px`);

          const activeNavItem = this.header.querySelector(`.${classes$B.isVisible}${selectors$H.navItem}`);

          if (activeNavItem) {
            activeNavItem.dispatchEvent(new Event('mouseenter', {bubbles: true}));
          }
        }
      }
    }

    handleBackgroundEvents() {
      this.headerWrapper.addEventListener('mouseenter', this.updateBackgroundHeightEvent);

      this.headerWrapper.addEventListener('mouseleave', this.updateBackgroundHeightEvent);

      this.header.addEventListener('focusout', this.updateBackgroundHeightEvent);

      document.addEventListener('theme:cart:close', this.updateBackgroundHeightEvent);

      // Helps fixing Safari issues with background not being updated on search close and mouse over the header
      document.addEventListener('theme:search:close', this.updateBackgroundHeightEvent);
    }

    updateBackgroundHeight(event) {
      const isDesktop = window.innerWidth >= window.theme.sizes.large;
      const isFocusEnabled = !document.body.classList.contains(classes$B.noOutline);
      const isNotTabbingOnDesktop = isDesktop && !isFocusEnabled;

      if (!event) return;

      // Update header background height on:
      // 'mouseenter' event
      if (event.type === 'mouseenter') {
        let popupsVisible = false;

        classes$B.jsDrawerOpenAll.forEach((popupClass) => {
          if (document.body.classList.contains(popupClass)) {
            popupsVisible = true;
          }
        });

        // Prevent background update:
        // On visible popups
        if (popupsVisible) return;

        // Update header background height:
        this.headerHeight = this.hasScrolled ? window.hasScrolledHeaderHeight : this.header.offsetHeight;

        this.header.classList.add(classes$B.headerHovered);

        if (!this.header.classList.contains(classes$B.headerMenuOpened)) {
          this.background.style.setProperty('--header-background-height', `${this.headerHeight}px`);
        }

        return;
      }

      // Remove header background and handle focus on:
      // 'mouseleave' event
      // 'theme:cart:close' event
      // 'theme:search:close' event
      // 'focusout' event

      if (event.type === 'focusout' && !isDesktop) return;
      if (event.type === 'theme:search:close' && !isNotTabbingOnDesktop) return;

      requestAnimationFrame(() => {
        const focusOutOfHeader = document.activeElement.closest(selectors$H.header) === null;

        if (event.type === 'focusout') {
          if (!focusOutOfHeader) return;
        }

        this.header.classList.remove(classes$B.headerHovered);
        this.background.style.setProperty('--header-background-height', '0px');

        if (!isFocusEnabled) {
          document.activeElement.blur();
        }
      });
    }

    controlNav() {
      // Reset nav to normal state
      this.nav.classList.remove(classes$B.navCompress);

      // Subtract 50 from width to give space between the logo and links
      const gap = 20; // Gap between Logo and Nav links
      const isNavCentered = this.header.dataset.navAlignment === 'center';
      const isNavLeft = this.header.dataset.navAlignment === 'left';
      const headerWrapperStyles = this.headerWrapper.currentStyle || window.getComputedStyle(this.headerWrapper);
      const headerWidth = this.headerWrapper.clientWidth - parseFloat(headerWrapperStyles.paddingLeft) - parseFloat(headerWrapperStyles.paddingRight);
      const logoWidth = this.logo ? this.logo.offsetWidth : 0;
      const navIconsWidth = this.navIcons ? this.navIcons.offsetWidth : 0;
      let maxNavWidth = headerWidth - logoWidth - navIconsWidth - gap;
      let navItemsWidth = this.getNavItemsWidth();

      if (isNavCentered) {
        maxNavWidth = headerWidth - (Math.max(logoWidth, navIconsWidth) + gap) * 2;
      }

      if (isNavLeft) {
        maxNavWidth = (headerWidth - (logoWidth + gap * 2)) / 2;
      }

      if (navItemsWidth > maxNavWidth) {
        this.nav.classList.add(classes$B.navCompress);
      } else {
        this.nav.classList.remove(classes$B.navCompress);
      }
    }

    getNavItemsWidth() {
      // Reset nav items width
      let navItemsWidth = 0;
      const navItems = this.nav.querySelectorAll(selectors$H.navItem);

      if (navItems.length) {
        navItems.forEach((item) => {
          // Round up to be safe
          navItemsWidth += Math.ceil(item.offsetWidth);
        });
      }

      return navItemsWidth;
    }

    initMobileNav() {
      if (theme.settings.mobileMenuBehaviour === 'link') {
        return;
      }

      const navMobileLinks = this.headerSection.querySelectorAll(selectors$H.navLinkMobile);
      if (navMobileLinks.length) {
        navMobileLinks.forEach((link) => {
          link.addEventListener('click', (e) => {
            const hasDropdown = link.parentNode.querySelectorAll(selectors$H.mobileNavDropdownTrigger).length;
            const dropdownTrigger = link.nextElementSibling;

            if (hasDropdown) {
              e.preventDefault();
              dropdownTrigger.dispatchEvent(new Event('click'), {bubbles: true});
            }
          });
        });
      }
    }

    onUnload() {
      document.body.classList.remove(...classes$B.jsDrawerOpenAll);
      document.removeEventListener('theme:scroll', this.headerStateEvent);
      document.removeEventListener('theme:resize:width', this.controlNav);
      document.removeEventListener('theme:cart:close', this.updateBackgroundHeightEvent);
      document.removeEventListener('theme:search:close', this.updateBackgroundHeightEvent);
      document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));

      if (typeof window.cart.destroy === 'function') {
        window.cart.destroy();
      }

      if (typeof window.drawer.unload === 'function') {
        window.drawer.unload();
      }
    }
  }

  const headerSection = {
    onLoad() {
      sections$f[this.id] = new Header(this.container);
    },
    onUnload() {
      sections$f[this.id].onUnload();
    },
  };

  register('header', [headerSection, hoverDisclosure, navSearch]);

  const selectors$I = {
    slider: '[data-slider]',
  };

  let sections$g = {};

  class IconsRow {
    constructor(section) {
      this.container = section.container;
      this.slider = this.container.querySelector(selectors$I.slider);
    }

    onBlockSelect(evt) {
      const sliderStyle = this.slider.currentStyle || window.getComputedStyle(this.slider);
      const sliderPadding = parseInt(sliderStyle.paddingLeft);
      const blockPositionLeft = evt.target.offsetLeft - sliderPadding;

      this.slider.scrollTo({
        top: 0,
        left: blockPositionLeft,
        behavior: 'smooth',
      });
    }
  }

  const iconsRowSection = {
    onLoad() {
      sections$g[this.id] = new IconsRow(this);
    },
    onBlockSelect(e) {
      sections$g[this.id].onBlockSelect(e);
    },
  };

  register('icons-row', iconsRowSection);

  const selectors$J = {
    item: '[data-accordion-item]',
    button: '[data-accordion-button]',
  };

  const classes$C = {
    isExpanded: 'is-expanded',
  };

  const sections$h = {};

  class ImageAccordions {
    constructor(section) {
      this.container = section.container;
      this.imageAccordionsItems = this.container.querySelectorAll(selectors$J.item);
      this.buttons = this.container.querySelectorAll(selectors$J.button);
      this.accordionExpandEvent = (item) => this.accordionExpand(item);
      this.accordionFocusEvent = (item) => this.accordionFocus(item);

      this.init();
    }

    init() {
      this.imageAccordionsItems.forEach((item) => {
        item.addEventListener('mouseenter', this.accordionExpandEvent.bind(this, item));
      });

      this.buttons.forEach((button) => {
        button.addEventListener('focusin', this.accordionFocusEvent.bind(this, button));
      });
    }

    accordionExpand(item) {
      if (!item.classList.contains(classes$C.isExpanded)) {
        this.imageAccordionsItems.forEach((item) => {
          item.classList.remove(classes$C.isExpanded);
        });
        item.classList.add(classes$C.isExpanded);
      }
    }

    accordionFocus(button) {
      button.closest(selectors$J.item).dispatchEvent(new Event('mouseenter'));
    }

    onBlockSelect(evt) {
      const element = evt.target;
      if (element) {
        element.dispatchEvent(new Event('mouseenter'));
      }
    }
  }

  const imageAccordionsSection = {
    onLoad() {
      sections$h[this.id] = new ImageAccordions(this);
    },
    onBlockSelect(evt) {
      sections$h[this.id].onBlockSelect(evt);
    },
  };

  register('image-accordions', imageAccordionsSection);

  register('image-with-text', videoPlay);

  register('list-collections', gridSlider);

  const sections$i = {};

  const selectors$K = {
    slider: '[data-slider-gallery]',
    sliderNav: '[data-slider-info]',
    item: '[data-slide-item]',
  };

  class Locations {
    constructor(section) {
      this.container = section.container;
      this.slider = this.container.querySelector(selectors$K.slider);
      this.sliderNav = this.container.querySelector(selectors$K.sliderNav);

      this.initSlider();
    }

    initSlider() {
      const slidesCount = this.container.querySelectorAll(selectors$K.item).length;
      let flkty = Flickity.data(this.slider) || null;
      let flktyNav = Flickity.data(this.sliderNav) || null;

      if (slidesCount <= 1) {
        return;
      }

      flkty = new Flickity(this.slider, {
        fade: true,
        wrapAround: true,
        adaptiveHeight: true,
        prevNextButtons: false,
        pageDots: false,
      });

      // iOS smooth scrolling fix
      flickitySmoothScrolling(this.slider);

      flktyNav = new Flickity(this.sliderNav, {
        fade: true,
        wrapAround: true,
        imagesLoaded: true,
        lazyLoad: true,
        asNavFor: this.slider,
        prevNextButtons: true,
        pageDots: false,
      });

      // Trigger text change on image move/drag
      flktyNav.on('change', () => {
        flkty.selectCell(flktyNav.selectedIndex);
      });

      // Trigger text change on image move/drag
      flkty.on('change', () => {
        flktyNav.selectCell(flkty.selectedIndex);
      });
    }

    onBlockSelect(evt) {
      const flkty = Flickity.data(this.slider) || null;
      const flktyNav = Flickity.data(this.sliderNav) || null;
      const index = parseInt([...evt.target.parentNode.children].indexOf(evt.target));

      if (flkty !== null) {
        flkty.select(index);
      }
      if (flktyNav !== null) {
        flktyNav.select(index);
      }
    }
  }

  const LocationsSection = {
    onLoad() {
      sections$i[this.id] = new Locations(this);
    },
    onBlockSelect(e) {
      sections$i[this.id].onBlockSelect(e);
    },
  };

  register('locations', LocationsSection);

  const sections$j = {};

  const selectors$L = {
    slider: '[data-slider]',
    sliderItem: '[data-slide-item]',
    pointer: '[data-pointer]',
    productGridItemImage: '[data-product-media-container]',
    quickViewItemHolder: '[data-quick-view-item-holder]',
    flickityButton: '.flickity-button',
    links: 'a, button',
  };

  const attributes$r = {
    pointer: 'data-pointer',
    hotspot: 'data-hotspot',
    tabIndex: 'tabindex',
  };

  const classes$D = {
    pointerSelected: 'pointer--selected',
    isSelected: 'is-selected',
    isActive: 'is-active',
    popupOpen: 'pswp--open',
  };

  class Look {
    constructor(section) {
      this.container = section.container;
      this.slider = this.container.querySelector(selectors$L.slider);
      this.slides = this.container.querySelectorAll(selectors$L.sliderItem);
      this.pointers = this.container.querySelectorAll(selectors$L.pointer);
      this.flkty = null;

      this.checkSlidesSizeOnResize = () => this.checkSlidesSize();
      this.pointersInit = (event) => this.dotPointers(event);
      this.pointersOver = () => this.dotPointerIn();
      this.pointersOut = () => this.dotPointerOut();

      this.debouncedBlockSelectCallback = debounce((event) => this.debouncedBlockSelect(event), 500);

      this.quickViewPopup = new QuickViewPopup(this.container);
      this.listen();
    }

    listen() {
      if (this.slider) {
        this.checkSlidesSize();
        document.addEventListener('theme:resize:width', this.checkSlidesSizeOnResize);
      }

      if (this.pointers.length > 0) {
        this.pointers.forEach((pointer) => {
          pointer.addEventListener('click', this.pointersInit);
          pointer.addEventListener('mouseover', this.pointersOver);
          pointer.addEventListener('mouseleave', this.pointersOut);
        });
      }
    }

    checkSlidesSize() {
      const isDesktop = window.innerWidth >= theme.sizes.small;

      if (isDesktop) {
        if (this.slides.length > 2) {
          this.initSlider();
        } else {
          this.destroySlider();
          this.slidesTabIndex();
        }

        return;
      }

      if (!isDesktop && this.slides.length > 1) {
        this.initSlider();

        return;
      }

      this.destroySlider();
    }

    initSlider() {
      if (this.flkty === null) {
        this.flkty = new Flickity(this.slider, {
          prevNextButtons: true,
          wrapAround: true,
          adaptiveHeight: false,
          cellAlign: 'left',
          groupCells: false,
          contain: true,
          on: {
            ready: () => {
              this.slidesTabIndex();
              this.setSliderArrowsPosition();
              this.dotPointers();
            },
            change: () => {
              this.slidesTabIndex();
              this.dotPointers();
            },
          },
        });

        return;
      }

      this.setSliderArrowsPosition();
    }

    setSliderArrowsPosition() {
      const isDesktop = window.innerWidth >= theme.sizes.small;

      if (!isDesktop) return;

      const arrows = this.slider.querySelectorAll(selectors$L.flickityButton);
      const image = this.slider.querySelector(selectors$L.productGridItemImage);

      if (arrows.length && image) {
        arrows.forEach((arrow) => {
          arrow.style.top = `${image.offsetHeight / 2}px`;
        });
      }
    }

    slidesTabIndex() {
      if (this.slides.length < 3) {
        this.slider.querySelectorAll(selectors$L.links).forEach((link) => {
          link.setAttribute(attributes$r.tabIndex, '0');
        });

        return;
      }

      const slider = Flickity.data(this.slider);

      slider.cells.forEach((slide) => {
        slide.element.querySelectorAll(selectors$L.links).forEach((link) => {
          link.setAttribute(attributes$r.tabIndex, '-1');
        });
      });

      slider.cells.forEach((slide) => {
        if (slide.element.classList.contains(classes$D.isSelected)) {
          slide.element.querySelectorAll(selectors$L.links).forEach((link) => {
            link.setAttribute(attributes$r.tabIndex, '0');
          });

          // Used to add tabindex = 0 to the other slide element that's visible as well, but is not marked as selected
          const secondaryElement = slide.element.nextSibling ? slide.element.nextSibling : slide.element.parentNode.firstChild;

          secondaryElement.querySelectorAll(selectors$L.links).forEach((link) => {
            link.setAttribute(attributes$r.tabIndex, '0');
          });
        }
      });
    }

    destroySlider() {
      if (typeof this.flkty === 'object' && this.flkty !== null) {
        this.flkty.destroy();
        this.flkty = null;
      }
    }

    dotPointers(event) {
      if (this.pointers.length === 0) return;

      this.pointers.forEach((button) => {
        button.classList.remove(classes$D.pointerSelected);
      });

      if (event) {
        const dotIndex = event.target.getAttribute(attributes$r.pointer);

        this.flkty?.select(dotIndex);

        return;
      }

      const slideIndex = this.flkty == null ? 0 : this.flkty.selectedIndex;

      if (slideIndex >= 0) {
        this.pointers[slideIndex].classList.add(classes$D.pointerSelected);
      }
    }

    dotPointerIn() {
      this.pointers.forEach((pointer) => {
        pointer.style.setProperty('--look-animation', 'none');
      });
    }

    dotPointerOut() {
      this.pointers.forEach((pointer) => {
        pointer.style.removeProperty('--look-animation');
      });
    }

    triggerClick(target) {
      requestAnimationFrame(() => target.dispatchEvent(new Event('click')));
    }

    destroyQuickViewPopup() {
      const pswpElement = this.quickViewPopup?.loadPhotoswipe?.pswpElement;
      if (!pswpElement) return;
      if (pswpElement.classList.contains(classes$D.popupOpen)) {
        this.quickViewPopup.loadPhotoswipe.popup.close();
      }
    }

    /**
     * Event callback for Theme Editor `shopify:block:select` event
     * The timeouts here are necessary for issues with selecting blocks from one `Shop the look` section to another
     */
    onBlockSelect(event) {
      this.debouncedBlockSelectCallback(event);
    }

    debouncedBlockSelect(event) {
      const pswpElement = this.quickViewPopup?.loadPhotoswipe?.pswpElement;

      // No popup element
      if (!pswpElement) {
        setTimeout(() => this.triggerClick(event.target), 400);
        return;
      }

      setTimeout(() => {
        // Popup initialized
        if (pswpElement.classList.contains(classes$D.popupOpen)) {
          // Popup opened
          const holder = this.quickViewPopup.loadPhotoswipe.pswpElement.querySelector(`[${attributes$r.hotspot}="${event.target.getAttribute(attributes$r.hotspot)}"]`);
          const quickViewItemHolders = this.quickViewPopup.loadPhotoswipe.pswpElement.querySelectorAll(selectors$L.quickViewItemHolder);

          holder.classList.add(classes$D.isActive);

          quickViewItemHolders.forEach((element) => {
            if (element !== holder) {
              element.classList.remove(classes$D.isActive);
            }
          });
        } else {
          // Popup closed
          this.triggerClick(event.target);
        }
      });
    }

    /**
     * Event callback for Theme Editor `shopify:section:unload` event
     */
    onUnload() {
      this.destroyQuickViewPopup();
      document.removeEventListener('theme:resize:width', this.checkSlidesSizeOnResize);
    }

    /**
     * Event callback for Theme Editor `shopify:section:deselect` event
     */
    onDeselect() {
      this.destroyQuickViewPopup();
    }
  }

  const lookSection = {
    onLoad() {
      sections$j[this.id] = new Look(this);
    },
    onUnload() {
      sections$j[this.id].onUnload();
    },
    onBlockSelect(event) {
      sections$j[this.id].onBlockSelect(event);
    },
    onDeselect() {
      sections$j[this.id].onDeselect();
    },
  };

  register('look', lookSection);

  const selectors$M = {
    grid: '[data-grid]',
  };

  const mosaicSection = {
    onBlockSelect(e) {
      const grid = e.target.closest(selectors$M.grid);
      const wrapperStyle = grid.currentStyle || window.getComputedStyle(grid);
      const wrapperPadding = parseInt(wrapperStyle.paddingLeft);
      const blockPositionLeft = e.target.offsetLeft - wrapperPadding;

      // Native scroll to item
      grid.scrollTo({
        top: 0,
        left: blockPositionLeft,
        behavior: 'smooth',
      });
    },
  };

  register('mosaic', mosaicSection);

  register('newsletter', newsletterSection);

  register('overlapping-images', videoPlay);

  const selectors$N = {
    toggleAdmin: '[data-toggle-admin]',
    toggleNewsletter: '[data-toggle-newsletter]',
    adminForm: '[data-form-admin]',
    newsletterForm: '[data-form-newsletter]',
  };

  let sections$k = {};

  class Password {
    constructor(section) {
      this.container = section.container;
      this.toggleAdmin = this.container.querySelector(selectors$N.toggleAdmin);
      this.toggleNewsletter = this.container.querySelector(selectors$N.toggleNewsletter);
      this.adminForm = this.container.querySelector(selectors$N.adminForm);
      this.newsletterForm = this.container.querySelector(selectors$N.newsletterForm);
      this.adminErrors = this.adminForm.querySelector('.errors');
      this.newsletterErrors = this.newsletterForm.querySelector('.errors');

      this.init();
    }

    init() {
      this.toggleAdmin.addEventListener('click', (e) => {
        e.preventDefault();
        this.showPasswordForm();
      });

      this.toggleNewsletter.addEventListener('click', (e) => {
        e.preventDefault();
        this.hidePasswordForm();
      });

      if (window.location.hash == '#login' || this.adminErrors) {
        this.showPasswordForm();
      } else {
        this.hidePasswordForm();
      }
    }

    showPasswordForm() {
      showElement(this.adminForm);
      hideElement(this.newsletterForm);
      window.location.hash = '#login';
    }

    hidePasswordForm() {
      showElement(this.newsletterForm);
      hideElement(this.adminForm);
      window.location.hash = '';
    }
  }

  const passwordSection = {
    onLoad() {
      sections$k[this.id] = new Password(this);
    },
  };

  register('password-template', passwordSection);

  const selectors$O = {
    largePromo: '[data-large-promo]',
    largePromoInner: '[data-large-promo-inner]',
    tracking: '[data-tracking-consent]',
    trackingInner: '[data-tracking-consent-inner]',
    trackingAccept: '[data-confirm-cookies]',
    popupBar: '[data-popup-bar]',
    popupBarHolder: '[data-popup-bar-holder]',
    popupBarToggle: '[data-popup-bar-toggle]',
    popupBody: '[data-popup-body]',
    popupClose: '[data-popup-close]',
    popupUnderlay: '[data-popup-underlay]',
    newsletterForm: '[data-newsletter-form]',
  };

  const attributes$s = {
    cookieName: 'data-cookie-name',
    targetReferrer: 'data-target-referrer',
    preventScrollLock: 'data-prevent-scroll-lock',
  };

  const classes$E = {
    success: 'has-success',
    error: 'has-error',
    selected: 'selected',
    hasBlockSelected: 'has-block-selected',
    expanded: 'popup--expanded',
    visible: 'popup--visible',
    mobile: 'mobile',
    desktop: 'desktop',
    popupBar: 'popup--bar',
    barIsVisible: 'popup-bar-is-visible',
  };

  let sections$l = {};
  let scrollLockTimer$1 = 0;
  let activePopups = 0;
  let popups = [];

  class DelayShow {
    constructor(popupContainer, popup) {
      this.popupContainer = popupContainer;
      this.popup = popup;
      this.popupBody = popup.querySelector(selectors$O.popupBody);
      this.delay = popupContainer.dataset.popupDelay;
      this.isSubmitted = window.location.href.indexOf('accepts_marketing') !== -1 || window.location.href.indexOf('customer_posted=true') !== -1;
      this.a11y = a11y;
      this.showPopupOnScrollEvent = () => this.showPopupOnScroll();

      if (this.delay === 'always' || this.isSubmitted) {
        this.always();
      }

      if (this.delay && this.delay.includes('delayed') && !this.isSubmitted) {
        const seconds = this.delay.includes('_') ? parseInt(this.delay.split('_')[1]) : 10;
        this.delayed(seconds);
      }

      if (this.delay === 'bottom' && !this.isSubmitted) {
        this.bottom();
      }

      if (this.delay === 'idle' && !this.isSubmitted) {
        this.idle();
      }
    }

    always() {
      this.showPopup();
    }

    delayed(seconds = 10) {
      setTimeout(() => {
        // Show popup after specific seconds
        this.showPopup();
      }, seconds * 1000);
    }

    // Scroll to the bottom of the page
    bottom() {
      document.addEventListener('theme:scroll', this.showPopupOnScrollEvent);
    }

    // Idle for 1 min
    idle() {
      const isTargetValid = this.checkPopupTarget() === true;
      if (!isTargetValid) {
        return;
      }

      let timer = 0;
      let idleTime = 60000;
      const documentEvents = ['mousemove', 'mousedown', 'click', 'touchmove', 'touchstart', 'touchend', 'keydown', 'keypress'];
      const windowEvents = ['load', 'resize', 'scroll'];

      const startTimer = () => {
        timer = setTimeout(() => {
          timer = 0;
          this.showPopup();
        }, idleTime);

        documentEvents.forEach((eventType) => {
          document.addEventListener(eventType, resetTimer);
        });

        windowEvents.forEach((eventType) => {
          window.addEventListener(eventType, resetTimer);
        });
      };

      const resetTimer = () => {
        if (timer) {
          clearTimeout(timer);
        }

        documentEvents.forEach((eventType) => {
          document.removeEventListener(eventType, resetTimer);
        });

        windowEvents.forEach((eventType) => {
          window.removeEventListener(eventType, resetTimer);
        });

        startTimer();
      };

      startTimer();
    }

    showPopup() {
      // Push every popup in array, so we can focus the next one, after closing each
      const popupElement = {id: this.popup.id, body: this.popupBody};
      popups.push(popupElement);

      const isTargetValid = this.checkPopupTarget() === true;

      if (isTargetValid) {
        activePopups += 1;
        this.popup.classList.add(classes$E.visible);
        if (this.popup.classList.contains(classes$E.popupBar)) {
          document.body.classList.add(classes$E.barIsVisible);
        }

        this.a11y.trapFocus({
          container: this.popupBody,
        });

        // The scroll is not locking if data-prevent-scroll-lock is added to the Popup container
        if (this.popup.hasAttribute(attributes$s.preventScrollLock)) {
          return false;
        }

        this.scrollLock();
      }
    }

    checkPopupTarget() {
      const targetMobile = this.popup.parentNode.classList.contains(classes$E.mobile);
      const targetDesktop = this.popup.parentNode.classList.contains(classes$E.desktop);

      if ((targetMobile && window.innerWidth >= theme.sizes.small) || (targetDesktop && window.innerWidth < theme.sizes.small)) {
        return false;
      } else {
        return true;
      }
    }

    scrollLock() {
      document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: this.popupBody}));
    }

    showPopupOnScroll() {
      if (window.scrollY + window.innerHeight >= document.body.clientHeight) {
        this.showPopup();
        document.removeEventListener('theme:scroll', this.showPopupOnScrollEvent);
      }
    }

    onUnload() {
      document.removeEventListener('theme:scroll', this.showPopupOnScrollEvent);
    }
  }

  class TargetReferrer {
    constructor(el) {
      this.popupContainer = el;
      this.locationPath = location.href;

      if (!this.popupContainer.hasAttribute(attributes$s.targetReferrer)) {
        return false;
      }

      if (this.locationPath.indexOf(this.popupContainer.getAttribute(attributes$s.targetReferrer)) === -1 && !window.Shopify.designMode) {
        this.popupContainer.parentNode.removeChild(this.popupContainer);
      }
    }
  }

  class LargePopup {
    constructor(el) {
      this.popupContainer = el;
      this.popup = this.popupContainer.querySelector(selectors$O.largePromoInner);
      this.popupBody = this.popup.querySelector(selectors$O.popupBody);
      this.popupId = this.popup.id;
      this.close = this.popup.querySelector(selectors$O.popupClose);
      this.underlay = this.popup.querySelector(selectors$O.popupUnderlay);
      this.form = this.popup.querySelector(selectors$O.newsletterForm);
      this.cookie = new PopupCookie(this.popupContainer.dataset.cookieName, 'user_has_closed');
      this.isTargeted = new TargetReferrer(this.popupContainer);
      this.a11y = a11y;

      this.init();
    }

    init() {
      const cookieExists = this.cookie.read() !== false;

      if (!cookieExists || window.Shopify.designMode) {
        if (!window.Shopify.designMode) {
          new DelayShow(this.popupContainer, this.popup);
        } else {
          this.showPopup();
        }

        if (this.form) {
          setTimeout(() => {
            if (this.form.classList.contains(classes$E.success)) {
              this.showPopupIfNoCookie();
            }
          });
        }

        this.initClosers();
      }
    }

    checkPopupTarget() {
      const targetMobile = this.popup.parentNode.classList.contains(classes$E.mobile);
      const targetDesktop = this.popup.parentNode.classList.contains(classes$E.desktop);

      if ((targetMobile && window.innerWidth >= theme.sizes.small) || (targetDesktop && window.innerWidth < theme.sizes.small)) {
        return false;
      } else {
        return true;
      }
    }

    showPopupIfNoCookie() {
      this.showPopup();
    }

    initClosers() {
      this.close.addEventListener('click', this.closePopup.bind(this));
      this.underlay.addEventListener('click', this.closePopup.bind(this));
      this.popupContainer.addEventListener('keyup', (e) => {
        if (e.keyCode === theme.keyboardKeys.ESCAPE) {
          this.closePopup(e);
        }
      });
    }

    closePopup(e) {
      e.preventDefault();
      this.hidePopup();
      this.cookie.write();
    }

    scrollLock() {
      this.resetScrollUnlock();
      this.a11y.trapFocus({
        container: this.popupBody,
      });
      document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: this.popupBody}));
    }

    scrollUnlock() {
      this.resetScrollUnlock();

      // Unlock scrollbar after popup animation completes
      scrollLockTimer$1 = setTimeout(() => {
        document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));
      }, 300);
    }

    resetScrollUnlock() {
      if (scrollLockTimer$1) {
        clearTimeout(scrollLockTimer$1);
      }
    }

    showPopup() {
      const isTargetValid = this.checkPopupTarget() === true;
      const popupElement = {id: this.popupId, body: this.popup};
      popups.push(popupElement);
      if (isTargetValid) {
        activePopups += 1;
        this.popup.classList.add(classes$E.visible);
        this.scrollLock();
      }
    }

    hidePopup() {
      this.popup.classList.remove(classes$E.visible);
      const popupIndex = popups.findIndex((x) => x.id === this.popupId);
      activePopups -= 1;
      popups.splice(popupIndex, 1);

      if (activePopups == 1 && document.body.classList.contains(classes$E.barIsVisible)) {
        this.scrollUnlock();
      } else if (activePopups < 1) {
        this.scrollUnlock();
        this.a11y.removeTrapFocus();
      } else if (popups.length > 0) {
        const nextPopup = popups[popups.length - 1].body;
        this.a11y.trapFocus({
          container: nextPopup,
        });
      }
    }

    onBlockSelect(evt) {
      if (this.popupContainer.contains(evt.target) && !this.popup.classList.contains(classes$E.visible)) {
        this.popup.classList.add(classes$E.selected);
        this.popupContainer.classList.add(classes$E.hasBlockSelected);
        this.showPopup();
      }
    }

    onBlockDeselect(evt) {
      if (this.popupContainer.contains(evt.target)) {
        this.popup.classList.remove(classes$E.selected);
        this.popupContainer.classList.remove(classes$E.hasBlockSelected);
        this.hidePopup();
      }
    }

    onUnload() {
      this.scrollUnlock();
    }

    onDeselect() {
      this.popup.classList.remove(classes$E.selected);
      this.popupContainer.classList.remove(classes$E.hasBlockSelected);
      this.hidePopup();
    }
  }

  class Tracking {
    constructor(el) {
      this.popupContainer = el;
      this.popup = this.popupContainer.querySelector(selectors$O.trackingInner);
      this.popupId = this.popup.id;
      this.close = this.popup.querySelector(selectors$O.popupClose);
      this.acceptButton = this.popup.querySelector(selectors$O.trackingAccept);
      this.enable = this.popupContainer.dataset.enable === 'true';
      this.a11y = a11y;

      window.Shopify.loadFeatures(
        [
          {
            name: 'consent-tracking-api',
            version: '0.1',
          },
        ],
        (error) => {
          if (error) {
            throw error;
          }

          const userCanBeTracked = window.Shopify.customerPrivacy.userCanBeTracked();
          const userTrackingConsent = window.Shopify.customerPrivacy.getTrackingConsent();

          this.enableTracking = !userCanBeTracked && userTrackingConsent === 'no_interaction' && this.enable;

          if (window.Shopify.designMode) {
            this.enableTracking = true;
          }

          this.init();
        }
      );
    }

    init() {
      if (this.enableTracking) {
        this.showPopup();
      }

      this.clickEvents();
    }

    clickEvents() {
      this.close.addEventListener('click', (event) => {
        event.preventDefault();

        window.Shopify.customerPrivacy.setTrackingConsent(false, () => this.hidePopup());
      });

      this.acceptButton.addEventListener('click', (event) => {
        event.preventDefault();

        window.Shopify.customerPrivacy.setTrackingConsent(true, () => this.hidePopup());
      });

      document.addEventListener('trackingConsentAccepted', () => {
        console.log('trackingConsentAccepted event fired');
      });
    }

    showPopup() {
      const popupElement = {id: this.popupId, body: this.popup};
      popups.push(popupElement);
      this.popup.classList.add(classes$E.visible);
      this.a11y.trapFocus({
        container: this.popup,
      });
    }

    hidePopup() {
      this.popup.classList.remove(classes$E.visible);
      const popupIndex = popups.findIndex((x) => x.id === this.popupId);
      popups.splice(popupIndex, 1);

      if (activePopups < 1) {
        this.a11y.removeTrapFocus();
      } else if (popups.length > 0) {
        const nextPopup = popups[popups.length - 1].body;
        this.a11y.trapFocus({
          container: nextPopup,
        });
      }
    }

    onBlockSelect(evt) {
      if (this.popupContainer.contains(evt.target) && this.enableTracking && !this.popup.classList.contains(classes$E.visible)) {
        this.showPopup();
        this.popup.classList.add(classes$E.selected);
        this.popup.parentNode.classList.add(classes$E.hasBlockSelected);
      }
    }

    onBlockDeselect(evt) {
      if (this.popupContainer.contains(evt.target)) {
        this.popup.classList.remove(classes$E.selected);
        this.popupContainer.classList.remove(classes$E.hasBlockSelected);
        this.hidePopup();
      }
    }

    onDeselect() {
      this.popup.classList.remove(classes$E.selected);
      this.popupContainer.classList.remove(classes$E.hasBlockSelected);
      this.hidePopup();
    }
  }

  class PopupBar {
    constructor(el) {
      this.popupContainer = el;
      this.popup = this.popupContainer.querySelector(selectors$O.popupBarHolder);
      this.popupBody = this.popup.querySelector(selectors$O.popupBody);
      this.popupId = this.popup.id;
      this.close = this.popup.querySelector(selectors$O.popupClose);
      this.underlay = this.popup.querySelector(selectors$O.popupUnderlay);
      this.toggle = this.popup.querySelector(selectors$O.popupBarToggle);
      this.cookie = new PopupCookie(this.popupContainer.dataset.cookieName, 'user_has_closed');
      this.form = this.popup.querySelector(selectors$O.newsletterForm);
      this.isTargeted = new TargetReferrer(this.popupContainer);
      this.a11y = a11y;

      this.init();
    }

    init() {
      const cookieExists = this.cookie.read() !== false;

      if (!cookieExists || window.Shopify.designMode) {
        if (!window.Shopify.designMode) {
          new DelayShow(this.popupContainer, this.popup);
        } else {
          this.showPopup();
        }

        this.initPopupToggleButton();
        this.initClosers();

        if (this.form) {
          setTimeout(() => {
            if (this.form.classList.contains(classes$E.success)) {
              this.showPopupIfNoCookie();
            }

            if (this.form.classList.contains(classes$E.error)) {
              // Expand popup if form has error
              this.toggle.dispatchEvent(new Event('click'));
            }
          });
        }
      }
    }

    checkPopupTarget() {
      const targetMobile = this.popup.parentNode.classList.contains(classes$E.mobile);
      const targetDesktop = this.popup.parentNode.classList.contains(classes$E.desktop);

      if ((targetMobile && window.innerWidth >= theme.sizes.small) || (targetDesktop && window.innerWidth < theme.sizes.small)) {
        return false;
      } else {
        return true;
      }
    }

    showPopupIfNoCookie() {
      this.showPopup();
      this.toggle.dispatchEvent(new Event('click'));
    }

    initPopupToggleButton() {
      this.toggle.addEventListener('click', (event) => {
        event.preventDefault();

        this.popup.classList.toggle(classes$E.expanded);

        if (this.popup.classList.contains(classes$E.expanded)) {
          this.scrollLock();
        } else {
          this.scrollUnlock();
        }
      });
    }

    showPopup() {
      const popupElement = {id: this.popupId, body: this.popup};
      popups.push(popupElement);
      this.a11y.trapFocus({
        container: this.popupBody,
      });
      const isTargetValid = this.checkPopupTarget() === true;
      if (isTargetValid) {
        activePopups += 1;
        document.body.classList.add(classes$E.barIsVisible);
        this.popup.classList.add(classes$E.visible);
      }
    }

    hidePopup() {
      this.popup.classList.remove(classes$E.visible);
      document.body.classList.remove(classes$E.barIsVisible);
      const popupIndex = popups.findIndex((x) => x.id === this.popupId);
      popups.splice(popupIndex, 1);

      if (activePopups >= 1) {
        activePopups -= 1;
      }

      if (activePopups < 1) {
        this.scrollUnlock();
        this.a11y.removeTrapFocus();
      } else if (popups.length > 0) {
        const nextPopup = popups[popups.length - 1].body;
        this.a11y.trapFocus({
          container: nextPopup,
        });
      }
    }

    initClosers() {
      this.close.addEventListener('click', this.closePopup.bind(this));
      this.underlay.addEventListener('click', () => this.toggle.dispatchEvent(new Event('click')));
      this.popupContainer.addEventListener('keyup', (e) => {
        if (e.keyCode === theme.keyboardKeys.ESCAPE) {
          this.popup.classList.remove(classes$E.expanded);
          this.scrollUnlock();
        }
      });
    }

    closePopup(e) {
      e.preventDefault();

      this.cookie.write();
      this.hidePopup();
    }

    scrollLock() {
      document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: this.popupBody}));
    }

    scrollUnlock() {
      this.resetScrollUnlock();

      // Unlock scrollbar after popup animation completes
      scrollLockTimer$1 = setTimeout(() => {
        document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));
      }, 300);
    }

    resetScrollUnlock() {
      if (scrollLockTimer$1) {
        clearTimeout(scrollLockTimer$1);
      }
    }

    onBlockSelect(evt) {
      if (this.popupContainer.contains(evt.target) && !this.popup.classList.contains(classes$E.visible)) {
        this.showPopup();
        this.popup.classList.add(classes$E.expanded);
        this.popup.classList.add(classes$E.selected);
        this.popup.parentNode.classList.add(classes$E.hasBlockSelected);
        this.resetScrollUnlock();
        this.scrollLock();
      }
    }

    onBlockDeselect(evt) {
      if (this.popupContainer.contains(evt.target)) {
        this.popup.classList.remove(classes$E.expanded);
        this.popup.classList.remove(classes$E.selected);
        this.popup.parentNode.classList.remove(classes$E.hasBlockSelected);
        this.hidePopup();
      }
    }

    onUnload() {
      this.scrollUnlock();
    }

    onDeselect() {
      this.popup.classList.remove(classes$E.expanded);
      this.popup.classList.remove(classes$E.selected);
      this.popup.parentNode.classList.remove(classes$E.hasBlockSelected);
      this.hidePopup();
    }
  }

  const popupSection = {
    onLoad() {
      sections$l[this.id] = [];

      if (window.Shopify.designMode) {
        activePopups = 0;
      }

      const popupsLarge = this.container.querySelectorAll(selectors$O.largePromo);
      if (popupsLarge.length) {
        popupsLarge.forEach((el) => {
          sections$l[this.id].push(new LargePopup(el));
        });
      }

      const popupBars = this.container.querySelectorAll(selectors$O.popupBar);
      if (popupBars.length) {
        popupBars.forEach((el) => {
          sections$l[this.id].push(new PopupBar(el));
        });
      }

      const cookiesPopups = this.container.querySelectorAll(selectors$O.tracking);
      if (cookiesPopups.length) {
        cookiesPopups.forEach((el) => {
          sections$l[this.id].push(new Tracking(el));
        });
      }
    },
    onDeselect() {
      sections$l[this.id].forEach((el) => {
        if (typeof el.onDeselect === 'function') {
          el.onDeselect();
        }
      });
    },
    onBlockSelect(evt) {
      sections$l[this.id].forEach((el) => {
        if (typeof el.onBlockSelect === 'function') {
          el.onBlockSelect(evt);
        }
      });
    },
    onBlockDeselect(evt) {
      sections$l[this.id].forEach((el) => {
        if (typeof el.onBlockDeselect === 'function') {
          el.onBlockDeselect(evt);
        }
      });
    },
    onUnload(evt) {
      sections$l[this.id].forEach((el) => {
        if (typeof el.onUnload === 'function') {
          el.onUnload(evt);
        }
      });
    },
  };

  register('popups', [popupSection, newsletterSection]);

  const selectors$P = {
    pressItems: '[data-press-items]',
    logoSlider: '[data-logo-slider]',
    logoSlide: '[data-logo-slide]',
    links: 'a, button',
  };

  const attributes$t = {
    logoSlide: 'data-logo-index',
    tabIndex: 'tabindex',
  };

  let sections$m = {};

  class Press {
    constructor(section) {
      this.container = section.container;
      this.slider = this.container.querySelector(selectors$P.pressItems);
      this.sliderNav = this.container.querySelector(selectors$P.logoSlider);
      this.sliderResizeEvent = () => this.checkSlides();

      this.initSlider();
      this.checkSlides();

      window.addEventListener('load', this.resizeSlider.bind(this));
      document.addEventListener('theme:resize:width', this.sliderResizeEvent);
    }

    checkSlides() {
      const containerWidth = this.container.offsetWidth;
      const slides = this.container.querySelectorAll(selectors$P.logoSlide);
      const sliderNav = Flickity.data(this.sliderNav) || null;

      if (sliderNav !== null) {
        sliderNav.options.draggable = false;
        sliderNav.options.wrapAround = false;
        sliderNav.options.contain = true;

        if (this.getSlidesWidth() > containerWidth && slides.length > 2) {
          sliderNav.options.draggable = true;
          sliderNav.options.wrapAround = true;
          sliderNav.options.contain = false;
        }
        sliderNav.resize();
        sliderNav.updateDraggable();
      }
    }

    getSlidesWidth() {
      const slides = this.container.querySelectorAll(selectors$P.logoSlide);
      let slidesTotalWidth = 0;

      if (slides.length) {
        slides.forEach((slide) => {
          slidesTotalWidth += slide.offsetWidth;
        });
      }
      return slidesTotalWidth;
    }

    /* Init slider */
    initSlider() {
      let flkty = Flickity.data(this.slider) || null;
      let flktyNav = Flickity.data(this.sliderNav) || null;

      flkty = new Flickity(this.slider, {
        fade: true,
        wrapAround: true,
        adaptiveHeight: true,
        prevNextButtons: false,
        pageDots: false,
      });

      flktyNav = new Flickity(this.sliderNav, {
        draggable: false,
        wrapAround: false,
        contain: true,
        imagesLoaded: true,
        lazyLoad: true,
        asNavFor: this.slider,
        prevNextButtons: false,
        adaptiveHeight: false,
        pageDots: false,
        on: {
          ready: () => {
            const slides = this.container.querySelectorAll(selectors$P.logoSlide);
            slides.forEach((slide) => {
              // Change slide text on logo change for a11y reasons
              slide.addEventListener('keyup', (e) => {
                if (e.keyCode === theme.keyboardKeys.ENTER || e.keyCode === theme.keyboardKeys.SPACE) {
                  const selectedIndex = Number(slide.getAttribute(attributes$t.logoSlide));
                  flkty.selectCell(selectedIndex);
                }
              });
            });
          },
        },
      });

      // iOS smooth scrolling fix
      flickitySmoothScrolling(this.slider);
      flickitySmoothScrolling(this.sliderNav);

      // Trigger text change on image move/drag
      flktyNav.on('change', (index) => {
        flkty.selectCell(index);
      });

      // Trigger text change on image move/drag
      flkty.on('change', (index) => {
        flktyNav.selectCell(index);

        flkty.cells.forEach((slide, i) => {
          slide.element.querySelectorAll(selectors$P.links).forEach((link) => {
            link.setAttribute(attributes$t.tabIndex, i === index ? '0' : '-1');
          });
        });
      });
    }

    // slider height fix on window load
    resizeSlider() {
      const hasSlider = Flickity.data(this.slider);

      if (hasSlider) {
        hasSlider.resize();
      }
    }

    onBlockSelect(evt) {
      const slider = Flickity.data(this.slider) || null;
      const sliderNav = Flickity.data(this.sliderNav) || null;
      const index = parseInt([...evt.target.parentNode.children].indexOf(evt.target));

      if (slider !== null) {
        slider.select(index);
      }

      if (sliderNav !== null) {
        sliderNav.select(index);
      }
    }

    onUnload() {
      document.removeEventListener('theme:resize:width', this.sliderResizeEvent);
    }
  }

  const pressSection = {
    onLoad() {
      sections$m[this.id] = new Press(this);
    },
    onUnload(e) {
      sections$m[this.id].onUnload(e);
    },
    onBlockSelect(e) {
      sections$m[this.id].onBlockSelect(e);
    },
  };

  register('press', pressSection);

  const selectors$Q = {
    slideshow: '[data-product-single-media-slider]',
    productInfo: '[data-product-info]',
    headerSticky: '[data-header-sticky]',
    headerHeight: '[data-header-height]',
  };

  const classes$F = {
    sticky: 'is-sticky',
  };

  const attributes$u = {
    stickyEnabled: 'data-sticky-enabled',
  };

  window.theme.variables = {
    productPageSticky: false,
  };

  const sections$n = {};

  class ProductSticky {
    constructor(section) {
      this.container = section.container;
      this.stickyEnabled = this.container.getAttribute(attributes$u.stickyEnabled) === 'true';
      this.productInfo = this.container.querySelector(selectors$Q.productInfo);
      this.stickyScrollTop = 0;
      this.scrollLastPosition = 0;
      this.stickyDefaultTop = 0;
      this.currentPoint = 0;
      this.defaultTopBottomSpacings = 30;
      this.scrollTop = window.scrollY;
      this.scrollDirectionDown = true;
      this.requestAnimationSticky = null;
      this.stickyFormLoad = true;
      this.stickyFormLastHeight = null;
      this.onChangeCounter = 0;
      this.scrollEvent = (e) => this.scrollEvents(e);
      this.resizeEvent = (e) => this.resizeEvents(e);

      this.init();
    }

    init() {
      if (this.stickyEnabled) {
        this.stickyScrollCheck();

        document.addEventListener('theme:resize', this.resizeEvent);
      }

      this.initSticky();
    }

    initSticky() {
      if (theme.variables.productPageSticky) {
        this.requestAnimationSticky = requestAnimationFrame(() => this.calculateStickyPosition());

        this.productInfo.addEventListener('theme:form:sticky', (e) => {
          this.removeAnimationFrame();

          this.requestAnimationSticky = requestAnimationFrame(() => this.calculateStickyPosition(e));
        });

        document.addEventListener('theme:scroll', this.scrollEvent);
      }
    }

    scrollEvents(e) {
      if (e.detail !== null) {
        this.scrollTop = e.detail.position;
        this.scrollDirectionDown = e.detail.down;
      }

      if (!this.requestAnimationSticky) {
        this.requestAnimationSticky = requestAnimationFrame(() => this.calculateStickyPosition());
      }
    }

    resizeEvents() {
      this.stickyScrollCheck();

      document.removeEventListener('theme:scroll', this.scrollEvent);

      this.initSticky();
    }

    stickyScrollCheck() {
      const windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
      const isDesktop = windowWidth >= window.theme.sizes.large;
      const targetProductInfo = this.container.querySelector(selectors$Q.productInfo);

      if (!targetProductInfo) return;

      if (isDesktop) {
        const productInfo = this.container.querySelector(selectors$Q.productInfo);
        const slideshow = this.container.querySelector(selectors$Q.slideshow);

        if (!productInfo || !slideshow) return;
        const productCopyHeight = productInfo.offsetHeight;
        const productImagesHeight = slideshow.offsetHeight;

        // Is the product form and description taller than window space
        // Is also shorter than the window and images
        if (productCopyHeight < productImagesHeight) {
          theme.variables.productPageSticky = true;
          targetProductInfo.classList.add(classes$F.sticky);
        } else {
          theme.variables.productPageSticky = false;
          targetProductInfo.classList.remove(classes$F.sticky);
        }
      } else {
        theme.variables.productPageSticky = false;
        targetProductInfo.classList.remove(classes$F.sticky);
      }
    }

    calculateStickyPosition(e = null) {
      const eventExist = Boolean(e && e.detail);
      const isAccordion = Boolean(eventExist && e.detail.element && e.detail.element === 'accordion');
      const productInfoHeight = this.productInfo.offsetHeight;
      const heightDifference = window.innerHeight - productInfoHeight - this.defaultTopBottomSpacings;
      const scrollDifference = Math.abs(this.scrollTop - this.scrollLastPosition);

      if (this.scrollDirectionDown) {
        this.stickyScrollTop -= scrollDifference;
      } else {
        this.stickyScrollTop += scrollDifference;
      }

      if (this.stickyFormLoad) {
        if (document.querySelector(selectors$Q.headerSticky) && document.querySelector(selectors$Q.headerHeight)) {
          this.stickyDefaultTop = parseInt(document.querySelector(selectors$Q.headerHeight).getBoundingClientRect().height);
        } else {
          this.stickyDefaultTop = this.defaultTopBottomSpacings;
        }

        this.stickyScrollTop = this.stickyDefaultTop;
      }

      this.stickyScrollTop = Math.min(Math.max(this.stickyScrollTop, heightDifference), this.stickyDefaultTop);

      const differencePoint = this.stickyScrollTop - this.currentPoint;
      this.currentPoint = this.stickyFormLoad ? this.stickyScrollTop : this.currentPoint + differencePoint * 0.5;

      this.productInfo.style.setProperty('--sticky-top', `${this.currentPoint}px`);

      this.scrollLastPosition = this.scrollTop;
      this.stickyFormLoad = false;

      if (
        (isAccordion && this.onChangeCounter <= 10) ||
        (isAccordion && this.stickyFormLastHeight !== productInfoHeight) ||
        (this.stickyScrollTop !== this.currentPoint && this.requestAnimationSticky)
      ) {
        if (isAccordion) {
          this.onChangeCounter += 1;
        }

        if (isAccordion && this.stickyFormLastHeight !== productInfoHeight) {
          this.onChangeCounter = 11;
        }

        this.requestAnimationSticky = requestAnimationFrame(() => this.calculateStickyPosition(e));
      } else if (this.requestAnimationSticky) {
        this.removeAnimationFrame();
      }

      this.stickyFormLastHeight = productInfoHeight;
    }

    removeAnimationFrame() {
      if (this.requestAnimationSticky) {
        cancelAnimationFrame(this.requestAnimationSticky);
        this.requestAnimationSticky = null;
        this.onChangeCounter = 0;
      }
    }

    onUnload() {
      if (this.stickyEnabled) {
        document.removeEventListener('theme:resize', this.resizeEvent);
      }

      if (theme.variables.productPageSticky) {
        document.removeEventListener('theme:scroll', this.scrollEvent);
      }
    }
  }

  const productStickySection = {
    onLoad() {
      sections$n[this.id] = new ProductSticky(this);
    },
    onUnload() {
      sections$n[this.id].onUnload();
    },
  };

  const selectors$R = {
    tooltip: '[data-tooltip]',
    tooltipContainer: '[data-tooltip-container]',
  };

  const classes$G = {
    root: 'tooltip-default',
    visible: 'is-visible',
    hiding: 'is-hiding',
  };

  const attributes$v = {
    tooltip: 'data-tooltip',
    tooltipContainer: 'data-tooltip-container',
    tooltipStopMouseEnter: 'data-tooltip-stop-mouseenter',
  };

  const sections$o = {};

  class Tooltip {
    constructor(el) {
      this.tooltip = el;
      if (!this.tooltip.hasAttribute(attributes$v.tooltip)) {
        return;
      }

      this.rootClass = classes$G.root;
      this.label = this.tooltip.getAttribute(attributes$v.tooltip);
      this.transitionSpeed = 200;
      this.hideTransitionTimeout = 0;
      this.addPinEvent = () => this.addPin();
      this.addPinMouseEvent = () => this.addPin(true);
      this.removePinEvent = (event) => throttle(this.removePin(event), 50);
      this.removePinMouseEvent = (event) => this.removePin(event, true, true);
      this.init();
    }

    init() {
      if (!document.querySelector(selectors$R.tooltipContainer)) {
        const tooltipTemplate = `<div class="${this.rootClass}__inner"><div class="${this.rootClass}__arrow"></div><div class="${this.rootClass}__text"></div></div>`;
        const tooltipElement = document.createElement('div');
        tooltipElement.className = this.rootClass;
        tooltipElement.setAttribute(attributes$v.tooltipContainer, '');
        tooltipElement.innerHTML = tooltipTemplate;
        document.body.appendChild(tooltipElement);
      }

      this.tooltip.addEventListener('mouseenter', this.addPinMouseEvent);
      this.tooltip.addEventListener('mouseleave', this.removePinMouseEvent);
      this.tooltip.addEventListener('theme:tooltip:init', this.addPinEvent);
      document.addEventListener('theme:tooltip:close', this.removePinEvent);
    }

    addPin(stopMouseEnter = false) {
      const tooltipTarget = document.querySelector(selectors$R.tooltipContainer);

      if (tooltipTarget && ((stopMouseEnter && !this.tooltip.hasAttribute(attributes$v.tooltipStopMouseEnter)) || !stopMouseEnter)) {
        const tooltipTargetInner = tooltipTarget.querySelector(`.${this.rootClass}__inner`);
        const tooltipTargetText = tooltipTarget.querySelector(`.${this.rootClass}__text`);
        tooltipTargetText.textContent = this.label;

        const tooltipTargetWidth = tooltipTargetInner.offsetWidth;
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const tooltipTop = tooltipRect.top;
        const tooltipWidth = tooltipRect.width;
        const tooltipHeight = tooltipRect.height;
        const tooltipTargetPositionTop = tooltipTop + tooltipHeight + window.scrollY;
        let tooltipTargetPositionLeft = tooltipRect.left - tooltipTargetWidth / 2 + tooltipWidth / 2;
        const tooltipLeftWithWidth = tooltipTargetPositionLeft + tooltipTargetWidth;
        const tooltipTargetWindowDifference = tooltipLeftWithWidth - window.innerWidth;

        if (tooltipTargetWindowDifference > 0) {
          tooltipTargetPositionLeft -= tooltipTargetWindowDifference;
        }

        if (tooltipTargetPositionLeft < 0) {
          tooltipTargetPositionLeft = 0;
        }

        tooltipTarget.style.transform = `translate(${tooltipTargetPositionLeft}px, ${tooltipTargetPositionTop}px)`;
        tooltipTarget.classList.remove(classes$G.hiding);
        tooltipTarget.classList.add(classes$G.visible);

        document.addEventListener('theme:scroll', this.removePinEvent);
      }
    }

    removePin(event, stopMouseEnter = false, hideTransition = false) {
      const tooltipTarget = document.querySelector(selectors$R.tooltipContainer);
      const tooltipVisible = tooltipTarget.classList.contains(classes$G.visible);

      if (tooltipTarget && ((stopMouseEnter && !this.tooltip.hasAttribute(attributes$v.tooltipStopMouseEnter)) || !stopMouseEnter)) {
        if (tooltipVisible && (hideTransition || event.detail.hideTransition)) {
          tooltipTarget.classList.add(classes$G.hiding);

          if (this.hideTransitionTimeout) {
            clearTimeout(this.hideTransitionTimeout);
          }

          this.hideTransitionTimeout = setTimeout(() => {
            tooltipTarget.classList.remove(classes$G.hiding);
          }, this.transitionSpeed);
        }

        tooltipTarget.classList.remove(classes$G.visible);

        document.removeEventListener('theme:scroll', this.removePinEvent);
      }
    }

    unload() {
      this.tooltip.removeEventListener('mouseenter', this.addPinMouseEvent);
      this.tooltip.removeEventListener('mouseleave', this.removePinMouseEvent);
      this.tooltip.removeEventListener('theme:tooltip:init', this.addPinEvent);
      document.removeEventListener('theme:tooltip:close', this.removePinEvent);
      document.removeEventListener('theme:scroll', this.removePinEvent);
    }
  }

  const tooltip = {
    onLoad() {
      sections$o[this.id] = [];
      const tooltips = this.container.querySelectorAll(selectors$R.tooltip);
      tooltips.forEach((tooltip) => {
        sections$o[this.id].push(new Tooltip(tooltip));
      });
    },
    onUnload() {
      sections$o[this.id].forEach((tooltip) => {
        if (typeof tooltip.unload === 'function') {
          tooltip.unload();
        }
      });
    },
  };

  const selectors$S = {
    mediaContainer: '[data-product-single-media-group]',
    productMediaSlider: '[data-product-single-media-slider]',
    zoomWrapper: '[data-zoom-wrapper]',
  };

  const classes$H = {
    popupClass: 'pswp-zoom-gallery',
    popupClassNoThumbs: 'pswp-zoom-gallery--single',
    isMoving: 'is-moving',
  };

  const attributes$w = {
    dataImageWidth: 'data-image-width',
    dataImageHeight: 'data-image-height',
  };

  class Zoom {
    constructor(container) {
      this.container = container;
      this.mediaContainer = this.container.querySelector(selectors$S.mediaContainer);
      this.slider = this.container.querySelector(selectors$S.productMediaSlider);
      this.zoomWrappers = this.container.querySelectorAll(selectors$S.zoomWrapper);
      this.zoomEnable = this.mediaContainer.dataset.gallery === 'true';
      this.a11y = a11y;

      if (this.zoomEnable) {
        this.init();
      }
    }

    init() {
      if (this.zoomWrappers.length) {
        this.zoomWrappers.forEach((element, i) => {
          element.addEventListener('click', (e) => {
            e.preventDefault();

            const isMoving = this.slider && this.slider.classList.contains(classes$H.isMoving);

            if (!isMoving) {
              this.a11y.state.trigger = element;
              this.createZoom(i);
            }
          });
        });
      }
    }

    createZoom(indexImage) {
      const instance = this;
      let items = [];
      let counter = 0;

      this.zoomWrappers.forEach((elementImage) => {
        const imgSrc = elementImage.getAttribute('href');
        const imgWidth = parseInt(elementImage.getAttribute(attributes$w.dataImageWidth));
        const imgHeight = parseInt(elementImage.getAttribute(attributes$w.dataImageHeight));

        items.push({
          src: imgSrc,
          w: imgWidth,
          h: imgHeight,
          msrc: imgSrc,
        });

        counter += 1;
        if (instance.zoomWrappers.length === counter) {
          let popupClass = `${classes$H.popupClass}`;
          if (counter === 1) {
            popupClass = `${classes$H.popupClass} ${classes$H.popupClassNoThumbs}`;
          }
          const options = {
            barsSize: {top: 60, bottom: 60},
            history: false,
            focus: false,
            index: indexImage,
            mainClass: popupClass,
            showHideOpacity: true,
            showAnimationDuration: 250,
            hideAnimationDuration: 250,
            closeOnScroll: false,
            closeOnVerticalDrag: false,
            captionEl: false,
            closeEl: true,
            closeElClasses: ['caption-close'],
            tapToClose: false,
            clickToCloseNonZoomable: false,
            maxSpreadZoom: 2,
            loop: true,
            spacing: 0,
            allowPanToNext: true,
            pinchToClose: false,
          };

          new LoadPhotoswipe(items, options);
        }
      });
    }
  }

  const selectors$T = {
    option: '[data-option]',
    popout: '[data-popout]',
    productMediaSlider: '[data-product-single-media-slider]',
    productMediaThumb: '[data-thumbnail-id]',
    productMediaThumbs: '[data-product-single-media-thumbs]',
    productMediaWrapper: '[data-product-single-media-wrapper]',
    productModel: '[data-model]',
    productSingleThumbnailLink: '.product-single__thumbnail-link',
    deferredMedia: '[data-deferred-media]',
    deferredMediaButton: '[data-deferred-media-button]',
    modalScrollContainer: '[data-tabs-holder]',
    formWrapper: '[data-form-wrapper]',
    tooltip: '[data-tooltip]',
    productRating: '[data-product-rating]',
    productReviews: '#shopify-product-reviews',
    links: 'a, button',
    upsellProduct: '[data-upsell-holder]',
    upsellProductSlider: '[data-upsell-slider]',
  };

  const classes$I = {
    featuredProduct: 'featured-product',
    featuredProductOnboarding: 'featured-product--onboarding',
    hasMediaActive: 'has-media-active',
    isSelected: 'is-selected',
    mediaHidden: 'media--hidden',
    noOutline: 'no-outline',
    hasPopup: 'has-popup',
    isMoving: 'is-moving',
  };

  const attributes$x = {
    mediaId: 'data-media-id',
    sectionId: 'data-section-id',
    thumbId: 'data-thumbnail-id',
    dataTallLayout: 'data-tall-layout',
    loaded: 'loaded',
    tabindex: 'tabindex',
  };

  const sections$p = {};

  class Product {
    constructor(section) {
      this.container = section.container;
      this.sectionId = this.container.getAttribute(attributes$x.sectionId);
      this.tallLayout = this.container.getAttribute(attributes$x.dataTallLayout) === 'true';
      this.formWrapper = this.container.querySelector(selectors$T.formWrapper);
      this.flkty = null;
      this.flktyNav = null;
      this.isFlickityDragging = false;
      this.enableHistoryState = !this.container.classList.contains(classes$I.featuredProduct);
      this.tooltips = [];
      this.checkSliderOnResize = () => this.checkSlider();
      this.flktyNavOnResize = () => this.resizeFlickityNav();

      this.scrollToReviews();

      new QuickViewPopup(this.container);

      // Skip initialization of product form, slider and media functions if section has onboarding content only
      if (this.container.classList.contains(classes$I.featuredProductOnboarding)) {
        return;
      }

      new Zoom(this.container);

      this.productSlider();
      this.initUpsellSlider();
      this.initMediaSwitch();
      this.initProductVideo();
      this.initProductModel();
      this.initShopifyXrLaunch();
    }

    productSlider() {
      this.checkSlider();
      document.addEventListener('theme:resize:width', this.checkSliderOnResize);
    }

    checkSlider() {
      if (!this.tallLayout || window.innerWidth <= theme.sizes.large) {
        this.initProductSlider();
        return;
      }

      this.destroyProductSlider();
    }

    resizeFlickityNav() {
      if (this.flktyNav !== null) {
        this.flktyNav.resize();
      }
    }

    /* Product Slider */
    initProductSlider() {
      const slider = this.container.querySelector(selectors$T.productMediaSlider);
      const thumbs = this.container.querySelector(selectors$T.productMediaThumbs);
      const media = this.container.querySelectorAll(selectors$T.productMediaWrapper);

      if (media.length > 1) {
        this.flkty = new Flickity(slider, {
          wrapAround: true,
          pageDots: false,
          adaptiveHeight: true,
          on: {
            ready: () => {
              slider.setAttribute(attributes$x.tabindex, '-1');

              media.forEach((item) => {
                if (!item.classList.contains(classes$I.isSelected)) {
                  const links = item.querySelectorAll(selectors$T.links);
                  if (links.length) {
                    links.forEach((link) => {
                      link.setAttribute(attributes$x.tabindex, '-1');
                    });
                  }
                }
              });
            },
            dragStart: () => {
              slider.classList.add(classes$I.isMoving);
            },
            dragMove: () => {
              // Prevent lightbox trigger on dragMove
              this.isFlickityDragging = true;
            },
            staticClick: () => {
              this.isFlickityDragging = false;
            },
            settle: (index) => {
              const currentSlide = this.flkty.selectedElement;
              const mediaId = currentSlide.getAttribute(attributes$x.mediaId);

              this.flkty.cells.forEach((slide, i) => {
                const links = slide.element.querySelectorAll(selectors$T.links);
                if (links.length) {
                  links.forEach((link) => {
                    link.setAttribute(attributes$x.tabindex, i === index ? '0' : '-1');
                  });
                }
              });
              this.switchMedia(mediaId);
              slider.classList.remove(classes$I.isMoving);
            },
          },
        });

        // Toggle flickity draggable functionality based on media play/pause state
        if (media.length) {
          media.forEach((el) => {
            el.addEventListener('theme:media:play', () => {
              this.flkty.options.draggable = false;
              this.flkty.updateDraggable();
              el.closest(selectors$T.productMediaSlider).classList.add(classes$I.hasMediaActive);
            });

            el.addEventListener('theme:media:pause', () => {
              this.flkty.options.draggable = true;
              this.flkty.updateDraggable();
              el.closest(selectors$T.productMediaSlider).classList.remove(classes$I.hasMediaActive);
            });
          });
        }

        // iOS smooth scrolling fix
        flickitySmoothScrolling(slider);

        if (thumbs !== null) {
          this.flktyNav = new Flickity(thumbs, {
            asNavFor: slider,
            contain: true,
            pageDots: false,
            prevNextButtons: false,
            resize: true,
            on: {
              ready: () => {
                thumbs.setAttribute(attributes$x.tabindex, '-1');
              },
            },
          });

          if (this.flktyNav !== null) {
            document.addEventListener('theme:resize:width', this.flktyNavOnResize);
          }

          // iOS smooth scrolling fix
          flickitySmoothScrolling(thumbs);

          // Disable link click
          const thumbLinks = this.container.querySelectorAll(selectors$T.productSingleThumbnailLink);
          if (thumbLinks.length) {
            thumbLinks.forEach((el) => {
              el.addEventListener('click', (e) => {
                e.preventDefault();
              });
            });
          }
        }
      }
    }

    destroyProductSlider() {
      if (this.flkty !== null) {
        this.flkty.destroy();
        this.flktyNav.destroy();

        this.flkty = null;
        this.flktyNav = null;
      }
    }

    /* Upsell Products Slider */
    initUpsellSlider() {
      const slider = this.container.querySelector(selectors$T.upsellProductSlider);
      const items = this.container.querySelectorAll(selectors$T.upsellProduct);

      if (items.length > 1) {
        const flktyUpsell = new Flickity(slider, {
          wrapAround: true,
          pageDots: true,
          adaptiveHeight: true,
          prevNextButtons: false,
        });

        flktyUpsell.on('change', (index) => {
          flktyUpsell.cells.forEach((slide, i) => {
            const links = slide.element.querySelectorAll(selectors$T.links);
            if (links.length) {
              links.forEach((link) => {
                link.setAttribute(attributes$x.tabindex, i === index ? '0' : '-1');
              });
            }
          });
        });
      }
    }

    handleMediaFocus(e) {
      // Do nothing if not ENTER key (13) or TAB key (9)
      if (e.keyCode !== theme.keyboardKeys.ENTER && e.keyCode !== theme.keyboardKeys.TAB) {
        return;
      }

      const mediaId = e.currentTarget.getAttribute(attributes$x.thumbId);
      const activeSlide = this.container.querySelector(`[${attributes$x.mediaId}="${mediaId}"]`);
      const slideIndex = parseInt([...activeSlide.parentNode.children].indexOf(activeSlide));
      const slider = this.container.querySelector(selectors$T.productMediaSlider);
      const sliderNav = this.container.querySelector(selectors$T.productMediaThumbs);
      const flkty = Flickity.data(slider) || null;
      const flktyNav = Flickity.data(sliderNav) || null;

      // Go to the related slide media
      if (flkty && flkty.isActive && slideIndex > -1 && e.keyCode === theme.keyboardKeys.ENTER) {
        flkty.select(slideIndex);
      }

      // Move thumbs to the selected one
      if (flktyNav && flktyNav.isActive && slideIndex > -1) {
        flktyNav.select(slideIndex);
      }
    }

    switchMedia(mediaId) {
      const mediaItems = document.querySelectorAll(`${selectors$T.productMediaWrapper}`);
      const selectedMedia = this.container.querySelector(`${selectors$T.productMediaWrapper}[${attributes$x.mediaId}="${mediaId}"]`);
      const isFocusEnabled = !document.body.classList.contains(classes$I.noOutline);

      // Pause other media
      if (mediaItems.length) {
        mediaItems.forEach((media) => {
          media.dispatchEvent(new CustomEvent('theme:media:hidden'), {bubbles: true});
          media.classList.add(classes$I.mediaHidden);
        });
      }

      if (isFocusEnabled) {
        selectedMedia.focus();
      }

      selectedMedia.closest(selectors$T.productMediaSlider).classList.remove(classes$I.hasMediaActive);
      selectedMedia.classList.remove(classes$I.mediaHidden);
      selectedMedia.dispatchEvent(new CustomEvent('theme:media:visible'), {bubbles: true});

      // If media is not loaded, trigger poster button click to load it
      const deferredMedia = selectedMedia.querySelector(selectors$T.deferredMedia);
      if (deferredMedia && deferredMedia.getAttribute(attributes$x.loaded) !== 'true') {
        selectedMedia.querySelector(selectors$T.deferredMediaButton).dispatchEvent(new Event('click'));
      }
    }

    initMediaSwitch() {
      const productThumbImages = this.container.querySelectorAll(selectors$T.productMediaThumb);
      if (productThumbImages.length) {
        productThumbImages.forEach((el) => {
          el.addEventListener('keyup', this.handleMediaFocus.bind(this));
          el.addEventListener('click', (e) => {
            e.preventDefault();
          });
        });
      }
    }

    initProductVideo() {
      this.videos = new ProductVideo(this.container);
    }

    initProductModel() {
      const modelItems = this.container.querySelectorAll(selectors$T.productModel);
      if (modelItems.length) {
        modelItems.forEach((element) => {
          theme.ProductModel.init(element, this.sectionId);
        });
      }
    }

    initShopifyXrLaunch() {
      document.addEventListener('shopify_xr_launch', () => {
        const currentMedia = this.container.querySelector(`${selectors$T.productModel}:not(.${classes$I.mediaHidden})`);
        currentMedia.dispatchEvent(new CustomEvent('xrLaunch'));
      });
    }

    onUnload() {
      if (this.flktyNav !== null) {
        document.removeEventListener('theme:resize:width', this.flktyNavOnResize);
      }

      document.removeEventListener('theme:resize:width', this.checkSliderOnResize);
    }

    scrollToReviews() {
      const productRating = this.container.querySelector(selectors$T.productRating);
      const events = ['click', 'keydown'];

      if (!productRating) {
        return;
      }

      events.forEach((eventName) => {
        productRating.addEventListener(eventName, (e) => {
          if (e.keyCode !== theme.keyboardKeys.ENTER || e.type != 'click') {
            const reviewsContainer = document.querySelector(selectors$T.productReviews);

            if (!reviewsContainer) {
              return;
            }

            reviewsContainer.scrollIntoView({behavior: 'smooth'});
          }
        });
      });
    }
  }

  const productSection = {
    onLoad() {
      sections$p[this.id] = new Product(this);
    },
    onUnload: function () {
      sections$p[this.id].onUnload();
    },
  };

  register('product-template', [productFormSection, productSection, swatchSection, shareButton, collapsible, tooltip, popoutSection, productStickySection]);
  register('featured-product', [productFormSection, productSection, swatchSection, shareButton, collapsible, tooltip, popoutSection, productStickySection]);

  const classes$J = {
    isDisabled: 'is-disabled',
  };

  const attributes$y = {
    circleTextParallax: 'data-circle-text-parallax',
  };

  class CircleText {
    constructor(el) {
      this.circleText = el;
      this.rotateDegree = 70;
      this.adjustRotateDegree = this.rotateDegree / 2; // We use this to keep the image upright when scrolling and it gets to the middle of the page

      this.scrollEvent = () => this.updateParallax();
      this.init();
    }

    init() {
      if (this.circleText.hasAttribute(attributes$y.circleTextParallax)) {
        document.addEventListener('theme:scroll', this.scrollEvent);
      }
    }

    updateParallax() {
      if (this.circleText.classList.contains(classes$J.isDisabled)) return;

      const windowHeight = Math.round(window.innerHeight);
      const scrollTop = Math.round(window.scrollY);
      const scrollBottom = scrollTop + windowHeight;
      const elementOffsetTopPoint = Math.round(this.circleText.getBoundingClientRect().top + scrollTop);
      const elementHeight = this.circleText.offsetHeight;
      const elementOffsetBottomPoint = elementOffsetTopPoint + elementHeight;
      const isBottomOfElementPassed = elementOffsetBottomPoint < scrollTop;
      const isTopOfElementReached = elementOffsetTopPoint < scrollBottom;
      const isInView = isTopOfElementReached && !isBottomOfElementPassed;

      if (isInView) {
        const scrollProgress = scrollBottom - elementOffsetTopPoint - elementHeight/2;
        const percentage = scrollProgress * 100 / windowHeight;
        let angle = this.rotateDegree * percentage / 100 * -1; // The -1 negates the value to have it rotate counterclockwise

        if (percentage > 0) {
          this.circleText.style.transform = `rotate(${this.adjustRotateDegree + angle}deg)`;
        }
      }
    }

    unload() {
      document.removeEventListener('theme:scroll', this.scrollEvent);
    }
  }

  const attributes$z = {
    href: 'href',
    mediaId: 'data-media-id',
  };

  const selectors$U = {
    deferredMedia: '[data-deferred-media]',
    deferredMediaButton: '[data-deferred-media-button]',
    productContentWrapper: '[data-product-content-wrapper]',
    productMediaWrapper: '[data-product-single-media-wrapper]',
    productModel: '[data-model]',
    productLink: '[data-product-link]',
    productSingleMediaImage: '[data-product-single-media-image]',
    sliderContents: '[data-slider-contents]',
    sliderImages: '[data-slider-images]',
    tabButton: '[data-tab-button]',
    tabItem: '[data-tab-item]',
    circleText: '[data-circle-text]',
  };

  const classes$K = {
    aosAnimate: 'aos-animate',
    tabButtonActive: 'products-list__nav__button--active',
    tabItemActive: 'products-list__item--active',
    mediaHidden: 'media--hidden',
    isDisabled: 'is-disabled',
  };

  const sections$q = {};

  class ProductsList {
    constructor(section) {
      this.container = section.container;
      this.sectionId = this.container.dataset.sectionId;
      this.tabButtons = this.container.querySelectorAll(selectors$U.tabButton);
      this.tabItems = this.container.querySelectorAll(selectors$U.tabItem);
      this.slidersImages = this.container.querySelectorAll(selectors$U.sliderImages);
      this.slidersContents = this.container.querySelectorAll(selectors$U.sliderContents);
      this.videos = {};
      this.flktyImages = [];
      this.flktyContent = [];
      this.sliderResizeEvent = () => this.resizeSlider();

      this.initButtons();
      this.initSliders();
      this.initProductVideo();
      this.initProductModel();
      this.initShopifyXrLaunch();
      this.initCircleText();
      this.listen();
    }

    listen() {
      if (this.slidersImages.length > 0 || this.slidersContents.length > 0) {
        document.addEventListener('theme:resize', this.sliderResizeEvent);
      }
    }

    resizeSlider() {
      if (this.flktyImages.length > 0) {
        requestAnimationFrame(() => {
          this.flktyImages.forEach((flktyImages) => flktyImages.resize());
        });
      }

      if (this.flktyContent.length > 0) {
        requestAnimationFrame(() => {
          this.flktyContent.forEach((flktyContent) => flktyContent.resize());
        });
      }
    }

    initButtons() {
      if (this.tabButtons.length) {
        this.tabButtons.forEach((tabButton) => {
          tabButton.addEventListener('click', (e) => {
            if (tabButton.classList.contains(classes$K.tabButtonActive)) {
              return;
            }

            const currentTabAnchor = tabButton.getAttribute(attributes$z.href);
            const currentTab = this.container.querySelector(currentTabAnchor);
            const currentMedia = currentTab.querySelector(selectors$U.productMediaWrapper);
            const mediaId = currentMedia ? currentMedia.dataset.mediaId : null;
            const currentCircleText = currentTab.querySelector(selectors$U.circleText);

            this.tabButtons.forEach((button) => {
              button.classList.remove(classes$K.tabButtonActive);
            });
            this.tabItems.forEach((item) => {
              const circleText = item.querySelector(selectors$U.circleText);
              item.classList.remove(classes$K.tabItemActive);
              circleText?.classList.add(classes$K.isDisabled);

              if (theme.settings.animations) {
                item.querySelectorAll(`.${classes$K.aosAnimate}`).forEach((element) => {
                  element.classList.remove(classes$K.aosAnimate);
                  setTimeout(() => {
                    element.classList.add(classes$K.aosAnimate);
                  });
                });
              }
            });

            tabButton.classList.add(classes$K.tabButtonActive);
            currentTab.classList.add(classes$K.tabItemActive);

            document.dispatchEvent(new Event('theme:resize')); // Trigger theme:resize event to refresh the slider height

            if (currentCircleText) {
              currentCircleText.classList.remove(classes$K.isDisabled);
              document.dispatchEvent(new Event('theme:scroll')); // Trigger theme:scroll event to refresh the circle-text values
            }

            if (mediaId) {
              this.switchMedia(mediaId);
            } else {
              this.pauseAllMedia();
            }

            e.preventDefault();
          });
        });
      }
    }

    initSliders() {
      this.slidersImages.forEach((sliderImages, idx) => {
        const contentsElement = sliderImages.closest(selectors$U.tabItem).querySelector(selectors$U.sliderContents);

        const flktyImages = new Flickity(sliderImages, {
          fade: true,
          pageDots: false,
          prevNextButtons: true,
          wrapAround: true,
          adaptiveHeight: true,
          asNavFor: contentsElement,
          on: {
            change: (index) => {
              if (this.flktyContent.length > 0) {
                this.flktyContent[idx].select(index);
              }
            },
          },
        });

        flktyImages.on('settle', (index) => {
          const elements = sliderImages.querySelectorAll(selectors$U.productMediaWrapper);

          for (let i = 0; i < elements.length; i++) {
            if (i === index) {
              elements[i].querySelector(selectors$U.productSingleMediaImage).removeAttribute('tabindex');
            } else {
              elements[i].querySelector(selectors$U.productSingleMediaImage).setAttribute('tabindex', '-1');
            }
          }
        });

        this.flktyImages.push(flktyImages);
      });

      this.slidersContents.forEach((sliderContent) => {
        const flktyContent = new Flickity(sliderContent, {
          fade: true,
          pageDots: false,
          prevNextButtons: false,
          wrapAround: true,
          adaptiveHeight: true,
        });

        flktyContent.on('settle', (index) => {
          const elements = sliderContent.querySelectorAll(selectors$U.productContentWrapper);

          for (let i = 0; i < elements.length; i++) {
            if (i === index) {
              elements[i].querySelectorAll(selectors$U.productLink).forEach((element) => {
                element.removeAttribute('tabindex');
              });
            } else {
              elements[i].querySelectorAll(selectors$U.productLink).forEach((element) => {
                element.setAttribute('tabindex', '-1');
              });
            }
          }
        });

        this.flktyContent.push(flktyContent);
      });
    }

    initProductVideo() {
      this.videos = new ProductVideo(this.container);
    }

    initProductModel() {
      const modelItems = this.container.querySelectorAll(selectors$U.productModel);
      if (modelItems.length) {
        modelItems.forEach((element) => {
          theme.ProductModel.init(element, this.sectionId);
        });
      }
    }

    initShopifyXrLaunch() {
      document.addEventListener('shopify_xr_launch', () => {
        const currentMedia = this.container.querySelector(`${selectors$U.productModel}:not(.${classes$K.mediaHidden})`);
        currentMedia.dispatchEvent(new CustomEvent('xrLaunch'));
      });
    }

    switchMedia(mediaId) {
      const selectedMedia = this.container.querySelector(`${selectors$U.productMediaWrapper}[${attributes$z.mediaId}="${mediaId}"]`);
      const isFocusEnabled = !document.body.classList.contains(classes$K.noOutline);

      this.pauseAllMedia();

      if (isFocusEnabled) {
        selectedMedia.focus();
      }

      selectedMedia.classList.remove(classes$K.mediaHidden);
      selectedMedia.dispatchEvent(new CustomEvent('theme:media:visible'), {bubbles: true});

      // If media is not loaded, trigger poster button click to load it
      const deferredMedia = selectedMedia.querySelector(selectors$U.deferredMedia);
      if (deferredMedia && deferredMedia.getAttribute(attributes$z.loaded) !== 'true') {
        selectedMedia.querySelector(selectors$U.deferredMediaButton).dispatchEvent(new Event('click'));
      }
    }

    pauseAllMedia() {
      const mediaItems = document.querySelectorAll(`${selectors$U.productMediaWrapper}`);

      if (mediaItems.length) {
        mediaItems.forEach((media) => {
          media.dispatchEvent(new CustomEvent('theme:media:hidden'), {bubbles: true});
          media.classList.add(classes$K.mediaHidden);
        });
      }
    }

    initCircleText() {
      const elements = this.container.querySelectorAll(selectors$U.circleText);

      elements.forEach((circleText) => {
        new CircleText(circleText);
      });
    }

    onBlockSelect(evt) {
      // Show selected tab
      evt.target.dispatchEvent(new Event('click'));
    }

    onUnload() {
      if (this.slidersImages.length > 0 || this.slidersContents.length > 0) {
        document.removeEventListener('theme:resize', this.sliderResizeEvent);
      }
    }
  }

  const productsListSection = {
    onLoad() {
      sections$q[this.id] = new ProductsList(this);
    },
    onUnload() {
      sections$q[this.id].onUnload();
    },
    onBlockSelect(e) {
      sections$q[this.id].onBlockSelect(e);
    },
  };

  register('products-list', productsListSection);

  const selectors$V = {
    product: '[data-product-block]',
    relatedProducts: '[data-related-products]',
  };

  const attributes$A = {
    sectionId: 'data-section-id',
    productId: 'data-product-id',
    limit: 'data-limit',
  };

  const sections$r = {};

  class RelatedProducts {
    constructor(container) {
      this.container = container;
      this.relatedProducts = this.container.querySelector(selectors$V.relatedProducts);

      this.init();
    }

    init() {
      const sectionId = this.container.getAttribute(attributes$A.sectionId);
      const productId = this.container.getAttribute(attributes$A.productId);
      const limit = this.container.getAttribute(attributes$A.limit);
      const requestUrl = `${theme.routes.product_recommendations_url}?section_id=${sectionId}&limit=${limit}&product_id=${productId}`;

      fetch(requestUrl)
        .then((response) => {
          return response.text();
        })
        .then((data) => {
          const createdElement = document.createElement('div');
          createdElement.innerHTML = data;
          const inner = createdElement.querySelector(selectors$V.relatedProducts);

          if (inner.querySelectorAll(selectors$V.product).length) {
            this.relatedProducts.innerHTML = inner.innerHTML;

            this.productGrid = new ProductGrid(this.container);
            this.gridSlider = new GridSlider(this.container);
          }
        });
    }

    /**
     * Event callback for Theme Editor `section:deselect` event
     */
    onDeselect() {
      if (this.productGrid) {
        this.productGrid.onDeselect();
      }
    }

    /**
     * Event callback for Theme Editor `section:unload` event
     */
    onUnload() {
      if (this.productGrid) {
        this.productGrid.onUnload();
      }

      if (this.gridSlider) {
        this.gridSlider.onUnload();
      }
    }
  }

  const RelatedProductsSection = {
    onLoad() {
      sections$r[this.id] = new RelatedProducts(this.container);
    },
    onDeselect() {
      sections$r[this.id].onDeselect();
    },
    onUnload() {
      sections$r[this.id].onUnload();
    },
  };

  register('related-products', RelatedProductsSection);

  const sections$s = {};

  const selectors$W = {
    slider: '[data-slider]',
    sliderItem: '[data-item]',
    buttonProductsShow: '[data-button-show]',
    buttonProductsHide: '[data-button-hide]',
    itemProducts: '[data-item-products]',
    itemProductSlider: '[data-item-products-slider]',
    itemProduct: '[data-item-product]',
    links: 'a, button',
  };

  const classes$L = {
    itemActive: 'blog-item--active',
    itemProductsVisible: 'blog-item__products--visible',
    featuredBlogSlider: 'shoppable-blog__slider',
    flickityEnabled: 'flickity-enabled',
    isSelected: 'is-selected',
  };

  const attributes$B = {
    slider: 'data-slider',
    slidePosition: 'data-slide-position',
    sectionId: 'data-section-id',
    tabIndex: 'tabindex',
  };

  class ShoppableBlog {
    constructor(section) {
      this.container = section.container;
      this.flkty = null;
      this.slider = this.container.querySelector(selectors$W.slider);
      this.checkSlidesSizeOnResize = () => this.checkSlidesSize();
      this.isFullWidth = this.container.hasAttribute(attributes$B.fullWidth);
      this.gutter = 0;
      this.a11y = a11y;
      this.clickOutsideItemEvent = (e) => {
        const clickOutsideSliderItem = !(e.target.matches(selectors$W.sliderItem) || e.target.closest(selectors$W.sliderItem));

        if (clickOutsideSliderItem) {
          const sliderItem = this.container.querySelectorAll(selectors$W.sliderItem);
          if (sliderItem.length) {
            sliderItem.forEach((item) => {
              const itemProducts = item.querySelector(selectors$W.itemProducts);
              if (itemProducts) {
                itemProducts.classList.remove(classes$L.itemProductsVisible);

                this.changeTabIndex(itemProducts);
              }
              item.classList.remove(classes$L.itemActive);
            });
          }
        }
      };

      this.bindButtons();
      this.listen();
    }

    initSlider() {
      this.flkty = new Flickity(this.slider, {
        prevNextButtons: true,
        pageDots: false,
        cellAlign: 'left',
        wrapAround: false,
        groupCells: true,
        contain: true,
        on: {
          ready: () => {
            this.handleFocus();
          },
        },
      });

      this.flkty.on('change', () => {
        const slides = this.container.querySelectorAll(selectors$W.sliderItem);

        this.handleFocus();

        if (slides.length) {
          slides.forEach((el) => {
            const itemProducts = el.querySelector(selectors$W.itemProducts);

            el.classList.remove(classes$L.itemActive);

            if (itemProducts) {
              el.querySelector(selectors$W.itemProducts).classList.remove(classes$L.itemProductsVisible);
            }
          });
        }

        if (this.flkty && !this.flkty.options.draggable) {
          this.flkty.options.draggable = true;
          this.flkty.updateDraggable();
        }
      });
    }

    destroySlider() {
      if (this.flkty !== null) {
        this.flkty.destroy();
        this.flkty = null;
      }
    }

    checkSlidesSize() {
      const sliderItemStyle = this.container.querySelector(selectors$W.sliderItem).currentStyle || window.getComputedStyle(this.container.querySelector(selectors$W.sliderItem));
      this.gutter = parseInt(sliderItemStyle.marginRight);
      const containerWidth = this.slider.offsetWidth + this.gutter;
      const itemsWidth = this.getItemsWidth();
      const itemsOverflowViewport = containerWidth < itemsWidth;

      if (window.innerWidth >= theme.sizes.small && itemsOverflowViewport) {
        this.initSlider();
      } else {
        this.destroySlider();
      }
    }

    getItemsWidth() {
      let itemsWidth = 0;
      const slides = this.slider.querySelectorAll(selectors$W.sliderItem);
      if (slides.length) {
        slides.forEach((item) => {
          itemsWidth += item.offsetWidth + this.gutter;
        });
      }

      return itemsWidth;
    }

    bindButtons() {
      const itemProductSlider = this.container.querySelectorAll(selectors$W.itemProductSlider);
      const buttonProductsShow = this.container.querySelectorAll(selectors$W.buttonProductsShow);
      const buttonProductsHide = this.container.querySelectorAll(selectors$W.buttonProductsHide);

      if (buttonProductsShow.length) {
        buttonProductsShow.forEach((button) => {
          button.addEventListener('click', (e) => {
            e.preventDefault();

            this.container.querySelectorAll(selectors$W.sliderItem).forEach((item) => {
              const itemProducts = item.querySelector(selectors$W.itemProducts);
              item.classList.remove(classes$L.itemActive);

              if (itemProducts) {
                itemProducts.classList.remove(classes$L.itemProductsVisible);

                this.changeTabIndex(itemProducts);
              }
            });

            const item = button.closest(selectors$W.sliderItem);
            const itemProducts = item.querySelector(selectors$W.itemProducts);
            item.classList.add(classes$L.itemActive);

            if (itemProducts) {
              itemProducts.classList.add(classes$L.itemProductsVisible);
              this.changeTabIndex(itemProducts, 'enable');

              const itemProductsSlider = itemProducts.querySelector(selectors$W.itemProductSlider);
              const allSlides = itemProductsSlider.querySelectorAll(selectors$W.itemProduct);
              const sliderActive = itemProductsSlider.classList.contains(classes$L.flickityEnabled);

              if (sliderActive) {
                const currentSlide = itemProductsSlider.querySelector(`.${classes$L.isSelected}`);
                const currentSlideIndex = currentSlide.getAttribute(attributes$B.slidePosition);

                allSlides.forEach((slide, i) => {
                  slide.setAttribute(attributes$B.tabIndex, i === currentSlideIndex ? '0' : '-1');
                });
              }
            }

            if (this.flkty !== null) {
              this.flkty.options.draggable = false;
              this.flkty.updateDraggable();
            }

            this.a11y.state.trigger = button;
          });
        });
      }

      if (buttonProductsHide.length) {
        buttonProductsHide.forEach((button) => {
          button.addEventListener('click', (e) => {
            e.preventDefault();
            const item = button.closest(selectors$W.sliderItem);
            const itemProducts = item.querySelector(selectors$W.itemProducts);
            item.classList.remove(classes$L.itemActive);

            if (itemProducts) {
              itemProducts.classList.remove(classes$L.itemProductsVisible);

              this.changeTabIndex(itemProducts);
            }

            if (this.flkty !== null) {
              this.flkty.options.draggable = true;
              this.flkty.updateDraggable();
            }

            this.a11y.state.trigger.focus();
          });
        });
      }

      if (itemProductSlider.length) {
        itemProductSlider.forEach((slider) => {
          const countSlides = slider.querySelectorAll(selectors$W.itemProduct).length;

          if (countSlides > 1) {
            const flktyProducts = new Flickity(slider, {
              prevNextButtons: true,
              contain: true,
              pageDots: false,
              wrapAround: true,
              on: {
                change: (index) => {
                  flktyProducts.cells.forEach((slide, i) => {
                    slide.element.querySelectorAll(selectors$W.links).forEach((link) => {
                      link.setAttribute(attributes$B.tabIndex, i === index ? '0' : '-1');
                    });
                  });
                },
              },
            });
          }
        });
      }

      this.slider.addEventListener('keyup', (e) => {
        if (e.keyCode === theme.keyboardKeys.ESCAPE) {
          const sliderItem = e.target.hasAttribute(attributes$B.slider) ? e.target.querySelectorAll(selectors$W.sliderItem) : e.target.closest(selectors$W.slider).querySelectorAll(selectors$W.sliderItem);

          if (sliderItem.length) {
            sliderItem.forEach((item) => {
              const itemProducts = item.querySelector(selectors$W.itemProducts);
              item.classList.remove(classes$L.itemActive);
              if (itemProducts) {
                itemProducts.classList.remove(classes$L.itemProductsVisible);

                this.changeTabIndex(itemProducts);
              }
            });

            if (this.flkty) {
              this.flkty.options.draggable = true;
              this.flkty.updateDraggable();
            }
          }

          this.a11y.state.trigger.focus();
        }
      });
    }

    handleFocus() {
      const sliderItems = this.container.querySelectorAll(selectors$W.sliderItem);

      if (sliderItems.length) {
        sliderItems.forEach((item) => {
          const selected = item.classList.contains(classes$L.isSelected);
          const itemProducts = item.querySelector(selectors$W.itemProducts);

          if (!selected) {
            this.changeTabIndex(item);

            if (itemProducts) {
              itemProducts.classList.remove(classes$L.itemProductsVisible);
            }
          } else {
            this.changeTabIndex(item, 'enable');

            if (itemProducts) {
              this.changeTabIndex(itemProducts);
            }
          }
        });
      }
    }

    listen() {
      if (this.slider) {
        this.checkSlidesSize();
        document.addEventListener('theme:resize:width', this.checkSlidesSizeOnResize);
      }

      document.addEventListener('mousedown', this.clickOutsideItemEvent);
    }

    changeTabIndex(items, state = '') {
      const tabIndex = state === 'enable' ? '0' : '-1';
      items.querySelectorAll(selectors$W.links).forEach((link) => {
        link.setAttribute(attributes$B.tabIndex, tabIndex);
      });
    }

    onBlockSelect(evt) {
      if (this.flkty !== null) {
        const index = parseInt([...evt.target.parentNode.children].indexOf(evt.target));
        const slidesPerPage = parseInt(this.flkty.slides[0].cells.length);
        const groupIndex = Math.floor(index / slidesPerPage);

        this.flkty.select(groupIndex);
      } else {
        const sliderStyle = this.slider.currentStyle || window.getComputedStyle(this.slider);
        const sliderPadding = parseInt(sliderStyle.paddingLeft);
        const blockPositionLeft = evt.target.offsetLeft - sliderPadding;

        // Native scroll to item
        this.slider.scrollTo({
          top: 0,
          left: blockPositionLeft,
          behavior: 'smooth',
        });
      }
    }

    onUnload() {
      document.removeEventListener('theme:resize:width', this.checkSlidesSizeOnResize);
      document.removeEventListener('mousedown', this.clickOutsideItemEvent);
    }
  }

  const shoppableBlogSection = {
    onLoad() {
      sections$s[this.id] = new ShoppableBlog(this);
    },
    onUnload(e) {
      sections$s[this.id].onUnload(e);
    },
    onBlockSelect(e) {
      sections$s[this.id].onBlockSelect(e);
    },
  };

  register('shoppable-blog', shoppableBlogSection);

  const selectors$X = {
    arrowScrollDown: '[data-scroll-down]',
    header: '[data-site-header]',
    item: '[data-slide]',
    links: 'a, button',
    main: '[data-main]',
    slider: '[data-slider]',
  };

  const attributes$C = {
    style: 'data-style',
    currentStyle: 'data-current-style',
    tabIndex: 'tabindex',
    slidePosition: 'data-slide-position',
  };

  const classes$M = {
    headerFixed: 'site-header--fixed',
  };

  const sections$t = {};

  class Slider {
    constructor(section) {
      this.container = section.container;
      this.header = document.querySelector(selectors$X.header);
      this.flkty = null;

      this.initSlider();
      this.initZoomAnimation();
      this.bindScrollButton();
    }

    initSlider() {
      const slidesCount = this.container.querySelectorAll(selectors$X.item).length;
      const duration = parseInt(this.container.dataset.duration);
      const pageDots = this.container.dataset.pageDots === 'true' && slidesCount > 1;
      const prevNextButtons = this.container.dataset.navArrows === 'true' && slidesCount > 1;
      let autoplay = this.container.dataset.autoplay === 'true';

      if (autoplay) {
        autoplay = duration;
      }

      if (slidesCount > 1) {
        this.flkty = new Flickity(this.container, {
          fade: true,
          cellSelector: selectors$X.item,
          autoPlay: autoplay,
          wrapAround: true,
          adaptiveHeight: true,
          setGallerySize: true,
          imagesLoaded: true,
          pageDots: pageDots,
          prevNextButtons: prevNextButtons,
          on: {
            ready: () => {
              const currentStyle = this.container.querySelector(`${selectors$X.item}[${attributes$C.slidePosition}="1"]`).getAttribute(attributes$C.style);
              this.container.setAttribute(attributes$C.currentStyle, currentStyle);
              requestAnimationFrame(() => {
                this.flkty.resize();
              });
            },
            change: (index) => {
              const currentSlide = this.flkty.selectedElement;
              const currentStyle = currentSlide.getAttribute(attributes$C.style);

              this.container.setAttribute(attributes$C.currentStyle, currentStyle);

              this.flkty.cells.forEach((slide, i) => {
                slide.element.querySelectorAll(selectors$X.links).forEach((link) => {
                  link.setAttribute(attributes$C.tabIndex, i === index ? '0' : '-1');
                });
              });
            },
          },
        });

        // iOS smooth scrolling fix
        flickitySmoothScrolling(this.container);
      } else if (slidesCount === 1) {
        const currentStyle = this.container.querySelector(selectors$X.item).getAttribute(attributes$C.style);
        this.container.setAttribute(attributes$C.currentStyle, currentStyle);
      }
    }

    // Parallax effect to zoom image on scroll
    initZoomAnimation() {
      if (this.container.dataset.zoomAnimation !== 'true') {
        return;
      }

      // Target element to be observed.
      const observedElement = this.container;
      const firstSection = document.body.querySelector(selectors$X.main).children[0];
      const isFirstSection = this.container.parentNode === firstSection;
      const hasTransparentHeader = this.header.dataset.transparent == 'true';

      const renderZoomEffect = () => {
        const headerHeight = isFirstSection & hasTransparentHeader ? 0 : parseInt(this.header.dataset.height || this.header.offsetHeight);
        const rect = observedElement.getBoundingClientRect();
        const sectionHeight = observedElement.offsetHeight;
        const scrolled = isFirstSection ? headerHeight - rect.top : headerHeight - rect.top + window.innerHeight;
        const scrolledPercentage = scrolled / sectionHeight;
        let transitionSpeed = 0.1; // Set value between 0 and 1. Bigger value will make the zoom more aggressive
        if (isFirstSection) {
          transitionSpeed *= 1.5;
        }

        let scale = 1 + scrolledPercentage * transitionSpeed;

        // Prevent image scale down under 100%
        scale = scale > 1 ? scale : 1;
        observedElement.style.setProperty('--scale', scale);
      };

      renderZoomEffect();

      this.zoomOnScrollEvent = throttle(renderZoomEffect, 5);

      // Intersection Observer Configuration
      const observerOptions = {
        root: null,
        rootMargin: '0px', // important: needs units on all values
        threshold: 0,
      };

      // Intersection Observer Callback Function
      const intersectionCallback = (entry) => {
        if (entry[0].isIntersecting) {
          window.addEventListener('scroll', this.zoomOnScrollEvent);
        } else {
          window.removeEventListener('scroll', this.zoomOnScrollEvent);
        }
      };

      // Intersection Observer Constructor.
      const observer = new IntersectionObserver(intersectionCallback, observerOptions);

      observer.observe(observedElement);
    }

    // Scroll down function
    bindScrollButton() {
      const arrowDown = this.container.querySelector(selectors$X.arrowScrollDown);

      if (arrowDown) {
        arrowDown.addEventListener('click', (e) => {
          e.preventDefault();

          const headerHeight = this.header.classList.contains(classes$M.headerFixed) ? 60 : 0;
          const scrollToPosition = parseInt(Math.ceil(this.container.offsetTop + this.container.offsetHeight - headerHeight));

          window.scrollTo({
            top: scrollToPosition,
            left: 0,
            behavior: 'smooth',
          });
        });
      }
    }

    onBlockSelect(evt) {
      const index = parseInt([...evt.target.parentNode.children].indexOf(evt.target));

      if (this.flkty !== null) {
        this.flkty.select(index);
        this.flkty.pausePlayer();
      }
    }

    onBlockDeselect(evt) {
      const autoplay = evt.target.closest(selectors$X.slider).dataset.autoplay === 'true';
      if (autoplay && this.flkty !== null) {
        this.flkty.playPlayer();
      }
    }

    onReorder() {
      if (this.flkty !== null) {
        this.flkty.resize();
      }
    }

    onUnload() {
      if (this.flkty !== null) {
        this.flkty.destroy();
        this.flkty = null;
      }

      if (this.zoomOnScrollEvent !== null) {
        window.removeEventListener('scroll', this.zoomOnScrollEvent);
      }
    }
  }

  const slider = {
    onLoad() {
      sections$t[this.id] = new Slider(this);
    },
    onReorder(e) {
      sections$t[this.id].onReorder(e);
    },
    onUnload(e) {
      sections$t[this.id].onUnload(e);
    },
    onBlockSelect(e) {
      sections$t[this.id].onBlockSelect(e);
    },
    onBlockDeselect(e) {
      sections$t[this.id].onBlockDeselect(e);
    },
  };

  register('slider', [slider, videoPlay]);

  register('subcollections', gridSlider);

  const selectors$Y = {
    scrollbar: '[data-custom-scrollbar]',
    scrollbarItems: '[data-custom-scrollbar-items]',
    scrollbarThumb: '[data-custom-scrollbar-thumb]',
  };

  class CustomScrollbar {
    constructor(container) {
      this.container = container;
      this.scrollbarItems = container.querySelector(selectors$Y.scrollbarItems);
      this.scrollbar = container.querySelector(selectors$Y.scrollbar);
      this.scrollbarThumb = container.querySelector(selectors$Y.scrollbarThumb);
      this.trackWidth = 0;
      this.calcScrollbarEvent = () => this.calculateScrollbar();
      this.onScrollbarChangeEvent = (e) => this.onScrollbarChange(e);

      if (this.scrollbar && this.scrollbarItems) {
        this.events();
        this.calculateScrollbar();
        if (this.scrollbarItems.children.length) {
          this.calculateTrack(this.scrollbarItems.children[0]);
        }
      }
    }

    calculateTrack(element) {
      const thumbScale = element.clientWidth / this.scrollbarThumb.parentElement.clientWidth;
      const thumbPosition = element.offsetLeft / this.scrollbarThumb.parentElement.clientWidth;
      this.scrollbar.style.setProperty('--thumb-scale', thumbScale);
      this.scrollbar.style.setProperty('--thumb-position', `${this.trackWidth * thumbPosition}px`);
    }

    calculateScrollbar() {
      if (this.scrollbarItems.children.length) {
        const childrenArr = [...this.scrollbarItems.children];
        this.trackWidth = 0;

        childrenArr.forEach((element) => {
          this.trackWidth += element.getBoundingClientRect().width + parseInt(window.getComputedStyle(element).marginRight);
        });
        this.scrollbar.style.setProperty('--track-width', `${this.trackWidth}px`);
      }
    }

    onScrollbarChange(e) {
      if (e && e.detail && e.detail.element && this.container.contains(e.detail.element)) {
        this.calculateTrack(e.detail.element);
      }
    }

    events() {
      document.addEventListener('theme:resize:width', this.calcScrollbarEvent);
      document.addEventListener('theme:custom-scrollbar:change', this.onScrollbarChangeEvent);
    }

    unload() {
      document.removeEventListener('theme:resize:width', this.calcScrollbarEvent);
      document.removeEventListener('theme:custom-scrollbar:change', this.onScrollbarChangeEvent);
    }
  }

  const selectors$Z = {
    tabLink: '[data-tab-link]',
    tabContent: '[data-tab-content]',
    scrollable: '[data-custom-scrollbar]',
    scrollableHolder: '[data-custom-scrollbar-holder]',
    slider: '[data-slider]',
    tabsContents: '[data-tabs-contents]',
  };

  const classes$N = {
    current: 'current',
    hide: 'hide',
    alt: 'alt',
    aosAnimate: 'aos-animate',
    aosInit: 'aos-init',
  };

  const attributes$D = {
    tabLink: 'data-tab-link',
    tabContent: 'data-tab-content',
    tabStartIndex: 'data-start-index',
  };

  const sections$u = {};

  class Tabs {
    constructor(container) {
      this.container = container;
      this.tabsContents = container.querySelector(selectors$Z.tabsContents);
      this.animateElementsTimer = null;

      if (this.container) {
        this.scrollable = this.container.querySelector(`${selectors$Z.scrollable}`);

        this.init();
        this.initCustomScrollbar();
      }
    }

    init() {
      const tabsNavList = this.container.querySelectorAll(selectors$Z.tabLink);
      const firstTabLink = this.container.querySelector(`[${attributes$D.tabLink}="${this.container.hasAttribute(attributes$D.tabStartIndex) ? this.container.getAttribute(attributes$D.tabStartIndex) : 0}"]`);
      const firstTabContent = this.container.querySelector(
        `[${attributes$D.tabContent}="${this.container.hasAttribute(attributes$D.tabStartIndex) ? this.container.getAttribute(attributes$D.tabStartIndex) : 0}"]`
      );

      if (firstTabContent) {
        firstTabContent.classList.add(classes$N.current);
      }

      if (firstTabLink) {
        firstTabLink.classList.add(classes$N.current);
      }

      this.checkVisibleTabLinks();

      if (tabsNavList.length) {
        tabsNavList.forEach((element) => {
          const tabId = parseInt(element.getAttribute(attributes$D.tabLink));
          const tab = this.container.querySelector(`[${attributes$D.tabContent}="${tabId}"]`);

          element.addEventListener('click', () => {
            this.tabChange(element, tab);
          });

          element.addEventListener('keyup', (event) => {
            if (event.which === theme.keyboardKeys.SPACE || event.which === theme.keyboardKeys.ENTER) {
              this.tabChange(element, tab);
            }
          });
        });
      }
    }

    initCustomScrollbar() {
      if (!this.scrollable) {
        return;
      }

      this.customScrollbar = new CustomScrollbar(this.container);
    }

    tabChange(element, tab) {
      if (element.classList.contains(classes$N.current)) {
        return;
      }

      const parent = element.closest(selectors$Z.scrollableHolder) ? element.closest(selectors$Z.scrollableHolder) : element.parentElement;
      const parentPadding = parseInt(window.getComputedStyle(parent).getPropertyValue('padding-left'));
      const lastActiveTab = this.container.querySelector(`${selectors$Z.tabContent}.${classes$N.current}`);
      const lastActiveTabLink = this.container.querySelector(`${selectors$Z.tabLink}.${classes$N.current}`);
      const slider = tab.querySelector(selectors$Z.slider);

      lastActiveTab.classList.remove(classes$N.current);
      lastActiveTabLink.classList.remove(classes$N.current);
      element.classList.add(classes$N.current);
      tab.classList.add(classes$N.current);

      // Trigger theme:tab:change custom event to reset the selected tab slider position
      if (slider) {
        slider.dispatchEvent(new CustomEvent('theme:tab:change', {bubbles: false}));
      }

      // Scroll to current tab link
      parent.scrollTo({
        top: 0,
        left: element.offsetLeft - parent.offsetWidth / 2 + element.offsetWidth / 2 + parentPadding,
        behavior: 'smooth',
      });

      element.dispatchEvent(
        new CustomEvent('theme:custom-scrollbar:change', {
          bubbles: true,
          detail: {
            element: element,
          },
        })
      );

      // Trigger animations if they are enabled
      if (theme.settings.animations) {
        this.tabsContents.querySelectorAll(`.${classes$N.aosInit}`).forEach((element) => {
          element.classList.remove(classes$N.aosAnimate);
        });

        if (this.animateElementsTimer) {
          clearTimeout(this.animateElementsTimer);
        }

        this.animateElementsTimer = setTimeout(() => {
          tab.querySelectorAll(`.${classes$N.aosInit}`).forEach((element) => {
            element.classList.add(classes$N.aosAnimate);
          });
        }, 150);
      }

      if (element.classList.contains(classes$N.hide)) {
        tab.classList.add(classes$N.hide);
      }

      this.checkVisibleTabLinks();
    }

    checkVisibleTabLinks() {
      const tabsNavList = this.container.querySelectorAll(selectors$Z.tabLink);
      const tabsNavListHidden = this.container.querySelectorAll(`${selectors$Z.tabLink}.${classes$N.hide}`);
      const difference = tabsNavList.length - tabsNavListHidden.length;

      if (difference < 2) {
        this.container.classList.add(classes$N.alt);
      } else {
        this.container.classList.remove(classes$N.alt);
      }
    }

    onBlockSelect(evt) {
      const element = evt.target;
      if (element) {
        element.dispatchEvent(new Event('click'));

        element.parentNode.scrollTo({
          top: 0,
          left: element.offsetLeft - element.clientWidth,
          behavior: 'smooth',
        });
      }
    }

    onUnload() {
      if (this.customScrollbar) {
        this.customScrollbar.unload();
      }
    }
  }

  const tabs = {
    onLoad() {
      sections$u[this.id] = new Tabs(this.container);
    },
    onBlockSelect(e) {
      sections$u[this.id].onBlockSelect(e);
    },
    onUnload() {
      sections$u[this.id].onUnload();
    },
  };

  register('tab-collections', [productGrid, gridSlider, tabs]);

  const sections$v = {};

  const selectors$_ = {
    slider: '[data-slider]',
    item: '[data-item]',
  };

  const classes$O = {
    flickityEnabled: 'flickity-enabled',
  };

  const attributes$E = {
    sectionId: 'data-section-id',
  };

  class Testimonials {
    constructor(section) {
      this.container = section.container;
      this.sectionId = this.container.getAttribute(attributes$E.sectionId);
      this.slider = this.container.querySelector(selectors$_.slider);
      this.sliderResizeEvent = () => this.initSlider();
      this.flkty = null;
      this.initSlider();

      document.addEventListener('theme:resize:width', this.sliderResizeEvent);
    }

    initSlider() {
      const slidesCount = this.slider.querySelectorAll(selectors$_.item).length;
      let flickityEnabled = this.slider.classList.contains(classes$O.flickityEnabled);

      // Destroy slider if there are 3 slides on desktop or 2 on tablet
      // Use native scrolling on mobile
      if ((slidesCount == 2 && window.innerWidth >= theme.sizes.small) ||
        slidesCount == 1 || window.innerWidth < theme.sizes.small) {

        if (flickityEnabled) {
          this.flkty.destroy();
        }

        return;
      }

      this.flkty = new Flickity(this.slider, {
        cellSelector: selectors$_.item,
        prevNextButtons: true,
        pageDots: false,
        groupCells: true,
        cellAlign: 'left',
        contain: true,
        adaptiveHeight: false,
      });

      this.flkty.resize();
      const isLargerThanVw = this.flkty.slideableWidth > this.flkty.size.width;
      // Destroy slider if slidable container is smaller than the slider's container width
      if (!isLargerThanVw) {
        this.flkty.destroy();
      }
    }

    onBlockSelect(evt) {
      if (this.flkty !== null) {
        const index = parseInt([...evt.target.parentNode.children].indexOf(evt.target));
        const slidesPerPage = parseInt(this.flkty.slides[0].cells.length);
        const groupIndex = Math.floor(index / slidesPerPage);

        this.flkty.select(groupIndex);
      } else {
        const sliderStyle = this.slider.currentStyle || window.getComputedStyle(this.slider);
        const sliderPadding = parseInt(sliderStyle.paddingLeft);
        const blockPositionLeft = evt.target.offsetLeft - sliderPadding;

        // Native scroll to item
        this.slider.scrollTo({
          top: 0,
          left: blockPositionLeft,
          behavior: 'smooth',
        });
      }
    }

    onUnload() {
      document.removeEventListener('theme:resize:width', this.sliderResizeEvent);
    }
  }


  const TestimonialsSection = {
    onLoad() {
      sections$v[this.id] = new Testimonials(this);
    },
    onUnload(e) {
      sections$v[this.id].onUnload(e);
    },
    onBlockSelect(e) {
      sections$v[this.id].onBlockSelect(e);
    },
  };

  register('testimonials', TestimonialsSection);

  const classes$P = {
    noOutline: 'no-outline',
  };

  const selectors$$ = {
    inPageLink: '[data-skip-content]',
    linkesWithOnlyHash: 'a[href="#"]',
  };

  class Accessibility {
    constructor() {
      this.init();
    }

    init() {
      // this.a11y = a11y;

      // DOM Elements
      this.body = document.body;
      this.inPageLink = document.querySelector(selectors$$.inPageLink);
      this.linkesWithOnlyHash = document.querySelectorAll(selectors$$.linkesWithOnlyHash);

      // Flags
      this.isFocused = false;

      // A11Y init methods
      this.focusHash();
      this.bindInPageLinks();

      // Events
      this.clickEvents();
      this.focusEvents();
      this.focusEventsOff();
    }

    /**
     * Clicked events accessibility
     *
     * @return  {Void}
     */

    clickEvents() {
      if (this.inPageLink) {
        this.inPageLink.addEventListener('click', (event) => {
          event.preventDefault();
        });
      }

      if (this.linkesWithOnlyHash) {
        this.linkesWithOnlyHash.forEach((item) => {
          item.addEventListener('click', (event) => {
            event.preventDefault();
          });
        });
      }
    }

    /**
     * Focus events
     *
     * @return  {Void}
     */

    focusEvents() {
      document.addEventListener('keyup', (event) => {
        if (event.keyCode !== theme.keyboardKeys.TAB) {
          return;
        }

        this.body.classList.remove(classes$P.noOutline);
        this.isFocused = true;
      });
    }

    /**
     * Focus events off
     *
     * @return  {Void}
     */

    focusEventsOff() {
      document.addEventListener('mousedown', () => {
        this.body.classList.add(classes$P.noOutline);
        this.isFocused = false;
      });
    }

    /**
     * Moves focus to an HTML element
     * eg for In-page links, after scroll, focus shifts to content area so that
     * next `tab` is where user expects. Used in bindInPageLinks()
     * eg move focus to a modal that is opened. Used in trapFocus()
     *
     * @param {Element} container - Container DOM element to trap focus inside of
     * @param {Object} options - Settings unique to your theme
     * @param {string} options.className - Class name to apply to element on focus.
     */

    forceFocus(element, options) {
      options = options || {};

      var savedTabIndex = element.tabIndex;

      element.tabIndex = -1;
      element.dataset.tabIndex = savedTabIndex;
      element.focus();
      if (typeof options.className !== 'undefined') {
        element.classList.add(options.className);
      }
      element.addEventListener('blur', callback);

      function callback(event) {
        event.target.removeEventListener(event.type, callback);

        element.tabIndex = savedTabIndex;
        delete element.dataset.tabIndex;
        if (typeof options.className !== 'undefined') {
          element.classList.remove(options.className);
        }
      }
    }

    /**
     * If there's a hash in the url, focus the appropriate element
     * This compensates for older browsers that do not move keyboard focus to anchor links.
     * Recommendation: To be called once the page in loaded.
     *
     * @param {Object} options - Settings unique to your theme
     * @param {string} options.className - Class name to apply to element on focus.
     * @param {string} options.ignore - Selector for elements to not include.
     */

    focusHash(options) {
      options = options || {};
      let hash = window.location.hash;

      if (typeof theme.settings.newHash !== 'undefined') {
        hash = theme.settings.newHash;
        window.location.hash = `#${hash}`;
      }
      const element = document.getElementById(hash.slice(1));

      // if we are to ignore this element, early return
      if (element && options.ignore && element.matches(options.ignore)) {
        return false;
      }

      if (hash && element) {
        this.forceFocus(element, options);
      }
    }

    /**
     * When an in-page (url w/hash) link is clicked, focus the appropriate element
     * This compensates for older browsers that do not move keyboard focus to anchor links.
     * Recommendation: To be called once the page in loaded.
     *
     * @param {Object} options - Settings unique to your theme
     * @param {string} options.className - Class name to apply to element on focus.
     * @param {string} options.ignore - CSS selector for elements to not include.
     */

    bindInPageLinks(options) {
      options = options || {};
      const links = Array.prototype.slice.call(document.querySelectorAll('a[href^="#"]'));

      function queryCheck(selector) {
        return document.getElementById(selector) !== null;
      }

      return links.filter((link) => {
        if (link.hash === '#' || link.hash === '') {
          return false;
        }

        if (options.ignore && link.matches(options.ignore)) {
          return false;
        }

        if (!queryCheck(link.hash.substr(1))) {
          return false;
        }

        var element = document.querySelector(link.hash);

        if (!element) {
          return false;
        }

        link.addEventListener('click', () => {
          this.forceFocus(element, options);
        });

        return true;
      });
    }
  }

  const getScrollbarWidth = () => {
    // Creating invisible container
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll'; // forcing scrollbar to appear
    outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps
    document.body.appendChild(outer);

    // Creating inner element and placing it in the container
    const inner = document.createElement('div');
    outer.appendChild(inner);

    // Calculating difference between container's full width and the child width
    const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

    // Removing temporary elements from the DOM
    outer.parentNode.removeChild(outer);

    return scrollbarWidth;
  };

  document.documentElement.style.setProperty('--scrollbar-width', `${getScrollbarWidth()}px`);

  document.addEventListener('DOMContentLoaded', function () {
    // Load all registered sections on the page.
    load('*');

    const showAnimations = document.body.dataset.animations === 'true';
    if (showAnimations) {
      AOS.init({
        once: true,
        offset: 50,
        duration: 600,
        startEvent: 'load',
      });
    }

    new Accessibility();

    if (!customElements.get('product-grid-item-swatch') && window.theme.settings.enableColorSwatchesCollection) {
      customElements.define('product-grid-item-swatch', GridSwatch);
    }

    // Safari smoothscroll polyfill
    const hasNativeSmoothScroll = 'scrollBehavior' in document.documentElement.style;

    if (!hasNativeSmoothScroll) {
      loadScript({url: theme.assets.smoothscroll});
    }
  });

}(themeVendor.ScrollLock, themeVendor.Flickity, themeVendor.Sqrl, themeVendor.themeCurrency, themeVendor.ajaxinate, themeVendor.AOS));
//# sourceMappingURL=theme.js.map
