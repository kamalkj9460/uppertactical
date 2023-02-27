var themeVendor = (function (exports) {
  'use strict';

  var query = "query countries($locale: SupportedLocale!) {"
    + "  countries(locale: $locale) {"
    + "    name"
    + "    code"
    + "    labels {"
    + "      address1"
    + "      address2"
    + "      city"
    + "      company"
    + "      country"
    + "      firstName"
    + "      lastName"
    + "      phone"
    + "      postalCode"
    + "      zone"
    + "    }"
    + "    formatting {"
    + "      edit"
    + "    }"
    + "    zones {"
    + "      name"
    + "      code"
    + "    }"
    + "  }"
    + "}";

  var GRAPHQL_ENDPOINT = 'https://country-service.shopifycloud.com/graphql';

  function loadCountries(locale) {
    var response = fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        query: query,
        operationName: 'countries',
        variables: {
          locale: toSupportedLocale(locale),
        },
      }),
    });

    return response
      .then(function(res) { return res.json() })
      .then(function(countries) { return countries.data.countries });
  }

  var DEFAULT_LOCALE = 'EN';
  var SUPPORTED_LOCALES = [
    'DA',
    'DE',
    'EN',
    'ES',
    'FR',
    'IT',
    'JA',
    'NL',
    'PT',
    'PT_BR',
  ];

  function toSupportedLocale(locale) {
    var supportedLocale = locale.replace(/-/, '_').toUpperCase();

    if (SUPPORTED_LOCALES.indexOf(supportedLocale) !== -1) {
      return supportedLocale;
    } else if (SUPPORTED_LOCALES.indexOf(supportedLocale.substring(0, 2)) !== -1) {
      return supportedLocale.substring(0, 2);
    } else {
      return DEFAULT_LOCALE;
    }
  }

  function mergeObjects() {
    var to = Object({});

    for (var index = 0; index < arguments.length; index++) {
      var nextSource = arguments[index];

      if (nextSource) {
        for (var nextKey in nextSource) {
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
    return to;
  }

  var FIELD_REGEXP = /({\w+})/g;
  var LINE_DELIMITER = '_';
  var INPUT_SELECTORS = {
    lastName: '[name="address[last_name]"]',
    firstName: '[name="address[first_name]"]',
    company: '[name="address[company]"]',
    address1: '[name="address[address1]"]',
    address2: '[name="address[address2]"]',
    country: '[name="address[country]"]',
    zone: '[name="address[province]"]',
    postalCode: '[name="address[zip]"]',
    city: '[name="address[city]"]',
    phone: '[name="address[phone]"]',
  };

  function AddressForm(rootEl, locale, options) {
    locale = locale || 'en';
    options = options || {inputSelectors: {}};
    var formElements = loadFormElements(
      rootEl,
      mergeObjects(INPUT_SELECTORS, options.inputSelectors)
    );

    validateElements(formElements);

    return loadShippingCountries(options.shippingCountriesOnly).then(function(
      shippingCountryCodes
    ) {
      return loadCountries(locale).then(function(countries) {
        init(
          rootEl,
          formElements,
          filterCountries(countries, shippingCountryCodes)
        );
      });
    });
  }

  /**
   * Runs when countries have been loaded
   */
  function init(rootEl, formElements, countries) {
    populateCountries(formElements, countries);
    var selectedCountry = formElements.country.input
      ? formElements.country.input.value
      : null;
    setEventListeners(rootEl, formElements, countries);
    handleCountryChange(rootEl, formElements, selectedCountry, countries);
  }

  /**
   * Handles when a country change: set labels, reorder fields, populate zones
   */
  function handleCountryChange(rootEl, formElements, countryCode, countries) {
    var country = getCountry(countryCode, countries);

    setLabels(formElements, country);
    reorderFields(rootEl, formElements, country);
    populateZones(formElements, country);
  }

  /**
   * Sets up event listener for country change
   */
  function setEventListeners(rootEl, formElements, countries) {
    formElements.country.input.addEventListener('change', function(event) {
      handleCountryChange(rootEl, formElements, event.target.value, countries);
    });
  }

  /**
   * Reorder fields in the DOM and add data-attribute to fields given a country
   */
  function reorderFields(rootEl, formElements, country) {
    var formFormat = country.formatting.edit;

    var countryWrapper = formElements.country.wrapper;
    var afterCountry = false;

    getOrderedField(formFormat).forEach(function(row) {
      row.forEach(function(line) {
        formElements[line].wrapper.dataset.lineCount = row.length;
        if (!formElements[line].wrapper) {
          return;
        }
        if (line === 'country') {
          afterCountry = true;
          return;
        }

        if (afterCountry) {
          rootEl.append(formElements[line].wrapper);
        } else {
          rootEl.insertBefore(formElements[line].wrapper, countryWrapper);
        }
      });
    });
  }

  /**
   * Update labels for a given country
   */
  function setLabels(formElements, country) {
    Object.keys(formElements).forEach(function(formElementName) {
      formElements[formElementName].labels.forEach(function(label) {
        label.textContent = country.labels[formElementName];
      });
    });
  }

  /**
   * Add right countries in the dropdown for a given country
   */
  function populateCountries(formElements, countries) {
    var countrySelect = formElements.country.input;
    var duplicatedCountrySelect = countrySelect.cloneNode(true);

    countries.forEach(function(country) {
      var optionElement = document.createElement('option');
      optionElement.value = country.code;
      optionElement.textContent = country.name;
      duplicatedCountrySelect.appendChild(optionElement);
    });

    countrySelect.innerHTML = duplicatedCountrySelect.innerHTML;

    if (countrySelect.dataset.default) {
      countrySelect.value = countrySelect.dataset.default;
    }
  }

  /**
   * Add right zones in the dropdown for a given country
   */
  function populateZones(formElements, country) {
    var zoneEl = formElements.zone;
    if (!zoneEl) {
      return;
    }

    if (country.zones.length === 0) {
      zoneEl.wrapper.dataset.ariaHidden = 'true';
      zoneEl.input.innerHTML = '';
      return;
    }

    zoneEl.wrapper.dataset.ariaHidden = 'false';

    var zoneSelect = zoneEl.input;
    var duplicatedZoneSelect = zoneSelect.cloneNode(true);
    duplicatedZoneSelect.innerHTML = '';

    country.zones.forEach(function(zone) {
      var optionElement = document.createElement('option');
      optionElement.value = zone.code;
      optionElement.textContent = zone.name;
      duplicatedZoneSelect.appendChild(optionElement);
    });

    zoneSelect.innerHTML = duplicatedZoneSelect.innerHTML;

    if (zoneSelect.dataset.default) {
      zoneSelect.value = zoneSelect.dataset.default;
    }
  }

  /**
   * Will throw if an input or a label is missing from the wrapper
   */
  function validateElements(formElements) {
    Object.keys(formElements).forEach(function(elementKey) {
      var element = formElements[elementKey].input;
      var labels = formElements[elementKey].labels;

      if (!element) {
        return;
      }

      if (typeof element !== 'object') {
        throw new TypeError(
          formElements[elementKey] + ' is missing an input or select.'
        );
      } else if (typeof labels !== 'object') {
        throw new TypeError(formElements[elementKey] + ' is missing a label.');
      }
    });
  }

  /**
   * Given an countryCode (eg. 'CA'), will return the data of that country
   */
  function getCountry(countryCode, countries) {
    countryCode = countryCode || 'CA';
    return countries.filter(function(country) {
      return country.code === countryCode;
    })[0];
  }

  /**
   * Given a format (eg. "{firstName}{lastName}_{company}_{address1}_{address2}_{city}_{country}{province}{zip}_{phone}")
   * will return an array of how the form needs to be formatted, eg.:
   * =>
   * [
   *   ['firstName', 'lastName'],
   *   ['company'],
   *   ['address1'],
   *   ['address2'],
   *   ['city'],
   *   ['country', 'province', 'zip'],
   *   ['phone']
   * ]
   */
  function getOrderedField(format) {
    return format.split(LINE_DELIMITER).map(function(fields) {
      var result = fields.match(FIELD_REGEXP);
      if (!result) {
        return [];
      }

      return result.map(function(fieldName) {
        var newFieldName = fieldName.replace(/[{}]/g, '');

        switch (newFieldName) {
          case 'zip':
            return 'postalCode';
          case 'province':
            return 'zone';
          default:
            return newFieldName;
        }
      });
    });
  }

  /**
   * Given a rootEl where all `input`s, `select`s, and `labels` are nested, it
   * will returns all form elements (wrapper, input and labels) of the form.
   * See `FormElements` type for details
   */
  function loadFormElements(rootEl, inputSelectors) {
    var elements = {};
    Object.keys(INPUT_SELECTORS).forEach(function(inputKey) {
      var input = rootEl.querySelector(inputSelectors[inputKey]);
      elements[inputKey] = input
        ? {
            wrapper: input.parentElement,
            input: input,
            labels: document.querySelectorAll('[for="' + input.id + '"]'),
          }
        : {};
    });

    return elements;
  }

  /**
   * If shippingCountriesOnly is set to true, will return the list of countries the
   * shop ships to. Otherwise returns null.
   */
  function loadShippingCountries(shippingCountriesOnly) {
    if (!shippingCountriesOnly) {
      // eslint-disable-next-line no-undef
      return Promise.resolve(null);
    }

    var response = fetch(location.origin + '/meta.json');

    return response
      .then(function(res) {
        return res.json();
      })
      .then(function(meta) {
        // If ships_to_countries has * in the list, it means the shop ships to
        // all countries
        return meta.ships_to_countries.indexOf('*') !== -1
          ? null
          : meta.ships_to_countries;
      })
      .catch(function() {
        return null;
      });
  }

  /**
   * Only returns countries that are in includedCountryCodes
   * Returns all countries if no includedCountryCodes is passed
   */
  function filterCountries(countries, includedCountryCodes) {
    if (!includedCountryCodes) {
      return countries;
    }

    return countries.filter(function(country) {
      return includedCountryCodes.indexOf(country.code) !== -1;
    });
  }

  var themeAddresses = /*#__PURE__*/Object.freeze({
    __proto__: null,
    AddressForm: AddressForm
  });

  /**
   * Currency Helpers
   * -----------------------------------------------------------------------------
   * A collection of useful functions that help with currency formatting
   *
   * Current contents
   * - formatMoney - Takes an amount in cents and returns it as a formatted dollar value.
   *
   */

  const moneyFormat = '${{amount}}';

  /**
   * Format money values based on your shop currency settings
   * @param  {Number|string} cents - value in cents or dollar amount e.g. 300 cents
   * or 3.00 dollars
   * @param  {String} format - shop money_format setting
   * @return {String} value - formatted value
   */
  function formatMoney(cents, format) {
    if (typeof cents === 'string') {
      cents = cents.replace('.', '');
    }
    let value = '';
    const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    const formatString = format || moneyFormat;

    function formatWithDelimiters(
      number,
      precision = 2,
      thousands = ',',
      decimal = '.'
    ) {
      if (isNaN(number) || number == null) {
        return 0;
      }

      number = (number / 100.0).toFixed(precision);

      const parts = number.split('.');
      const dollarsAmount = parts[0].replace(
        /(\d)(?=(\d\d\d)+(?!\d))/g,
        `$1${thousands}`
      );
      const centsAmount = parts[1] ? decimal + parts[1] : '';

      return dollarsAmount + centsAmount;
    }

    switch (formatString.match(placeholderRegex)[1]) {
      case 'amount':
        value = formatWithDelimiters(cents, 2);
        break;
      case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0);
        break;
      case 'amount_with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',');
        break;
    }

    return formatString.replace(placeholderRegex, value);
  }

  var currency = /*#__PURE__*/Object.freeze({
    __proto__: null,
    formatMoney: formatMoney
  });

  /**
   * Image Helper Functions
   * -----------------------------------------------------------------------------
   * https://github.com/Shopify/slate.git.
   *
   */

  /**
   * Preloads an image in memory and uses the browsers cache to store it until needed.
   *
   * @param {Array} images - A list of image urls
   * @param {String} size - A shopify image size attribute
   */

  function preload(images, size) {
    if (typeof images === 'string') {
      images = [images];
    }

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      loadImage(getSizedImageUrl(image, size));
    }
  }

  /**
   * Loads and caches an image in the browsers cache.
   * @param {string} path - An image url
   */
  function loadImage(path) {
    new Image().src = path;
  }

  /**
   * Find the Shopify image attribute size
   *
   * @param {string} src
   * @returns {null}
   */
  function imageSize(src) {
    const match = src.match(
      /.+_((?:pico|icon|thumb|small|compact|medium|large|grande)|\d{1,4}x\d{0,4}|x\d{1,4})[_\.@]/
    );

    if (match) {
      return match[1];
    } else {
      return null;
    }
  }

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

    if (size === 'master') {
      return removeProtocol(src);
    }

    const match = src.match(/\.(jpg|jpeg|gif|png|bmp|bitmap|tiff|tif)(\?v=\d+)?$/i);

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

  var images = /*#__PURE__*/Object.freeze({
    __proto__: null,
    preload: preload,
    loadImage: loadImage,
    imageSize: imageSize,
    getSizedImageUrl: getSizedImageUrl,
    removeProtocol: removeProtocol
  });

  /* @preserve
   * https://github.com/Elkfox/Ajaxinate
   * Copyright (c) 2017 Elkfox Co Pty Ltd (elkfox.com)
   * MIT License (do not remove above copyright!)
   */

  /* Configurable options;
   *
   * method: scroll or click
   * container: selector of repeating content
   * pagination: selector of pagination container
   * offset: number of pixels before the bottom to start loading more on scroll
   * loadingText: 'Loading', The text shown during when appending new content
   * callback: null, callback function after new content is appended
   *
   * Usage;
   *
   * import {Ajaxinate} from 'ajaxinate';
   *
   * new Ajaxinate({
   *   offset: 5000,
   *   loadingText: 'Loading more...',
   * });
   */

  /* eslint-env browser */
  function Ajaxinate(config) {
    const settings = config || {};

    const defaults = {
      method: 'scroll',
      container: '#AjaxinateContainer',
      pagination: '#AjaxinatePagination',
      offset: 0,
      loadingText: 'Loading',
      callback: null,
    };

    // Merge custom configs with defaults
    this.settings = Object.assign(defaults, settings);

    // Functions
    this.addScrollListeners = this.addScrollListeners.bind(this);
    this.addClickListener = this.addClickListener.bind(this);
    this.checkIfPaginationInView = this.checkIfPaginationInView.bind(this);
    this.preventMultipleClicks = this.preventMultipleClicks.bind(this);
    this.removeClickListener = this.removeClickListener.bind(this);
    this.removeScrollListener = this.removeScrollListener.bind(this);
    this.removePaginationElement = this.removePaginationElement.bind(this);
    this.destroy = this.destroy.bind(this);

    // Selectors
    this.containerElement = document.querySelector(this.settings.container);
    this.paginationElement = document.querySelector(this.settings.pagination);
    this.initialize();
  }

  Ajaxinate.prototype.initialize = function initialize() {
    if (!this.containerElement) { return; }

    const initializers = {
      click: this.addClickListener,
      scroll: this.addScrollListeners,
    };

    initializers[this.settings.method]();
  };

  Ajaxinate.prototype.addScrollListeners = function addScrollListeners() {
    if (!this.paginationElement) { return; }

    document.addEventListener('scroll', this.checkIfPaginationInView);
    window.addEventListener('resize', this.checkIfPaginationInView);
    window.addEventListener('orientationchange', this.checkIfPaginationInView);
  };

  Ajaxinate.prototype.addClickListener = function addClickListener() {
    if (!this.paginationElement) { return; }

    this.nextPageLinkElement = this.paginationElement.querySelector('a');
    this.clickActive = true;

    if (typeof this.nextPageLinkElement !== 'undefined' && this.nextPageLinkElement !== null) {
      this.nextPageLinkElement.addEventListener('click', this.preventMultipleClicks);
    }
  };

  Ajaxinate.prototype.preventMultipleClicks = function preventMultipleClicks(event) {
    event.preventDefault();

    if (!this.clickActive) { return; }

    this.nextPageLinkElement.innerText = this.settings.loadingText;
    this.nextPageUrl = this.nextPageLinkElement.href;
    this.clickActive = false;

    this.loadMore();
  };

  Ajaxinate.prototype.checkIfPaginationInView = function checkIfPaginationInView() {
    const top = this.paginationElement.getBoundingClientRect().top - this.settings.offset;
    const bottom = this.paginationElement.getBoundingClientRect().bottom + this.settings.offset;

    if (top <= window.innerHeight && bottom >= 0) {
      this.nextPageLinkElement = this.paginationElement.querySelector('a');
      this.removeScrollListener();

      if (this.nextPageLinkElement) {
        this.nextPageLinkElement.innerText = this.settings.loadingText;
        this.nextPageUrl = this.nextPageLinkElement.href;

        this.loadMore();
      }
    }
  };

  Ajaxinate.prototype.loadMore = function loadMore() {
    this.request = new XMLHttpRequest();

    this.request.onreadystatechange = function success() {
      if (!this.request.responseXML) { return; }
      if (!this.request.readyState === 4 || !this.request.status === 200) { return; }

      const newContainer = this.request.responseXML.querySelectorAll(this.settings.container)[0];
      const newPagination = this.request.responseXML.querySelectorAll(this.settings.pagination)[0];

      this.containerElement.insertAdjacentHTML('beforeend', newContainer.innerHTML);

      if (typeof newPagination === 'undefined') {
        this.removePaginationElement();
      } else {
        this.paginationElement.innerHTML = newPagination.innerHTML;

        if (this.settings.callback && typeof this.settings.callback === 'function') {
          this.settings.callback(this.request.responseXML);
        }

        this.initialize();
      }
    }.bind(this);

    this.request.open('GET', this.nextPageUrl);
    this.request.responseType = 'document';
    this.request.send();
  };

  Ajaxinate.prototype.removeClickListener = function removeClickListener() {
    this.nextPageLinkElement.removeEventListener('click', this.preventMultipleClicks);
  };

  Ajaxinate.prototype.removePaginationElement = function removePaginationElement() {
    this.paginationElement.innerHTML = '';
    this.destroy();
  };

  Ajaxinate.prototype.removeScrollListener = function removeScrollListener() {
    document.removeEventListener('scroll', this.checkIfPaginationInView);
    window.removeEventListener('resize', this.checkIfPaginationInView);
    window.removeEventListener('orientationchange', this.checkIfPaginationInView);
  };

  Ajaxinate.prototype.destroy = function destroy() {
    const destroyers = {
      click: this.removeClickListener,
      scroll: this.removeScrollListener,
    };

    destroyers[this.settings.method]();

    return this;
  };

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function getDefaultExportFromCjs (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
  }

  function createCommonjsModule(fn) {
    var module = { exports: {} };
  	return fn(module, module.exports), module.exports;
  }

  var aos = createCommonjsModule(function (module, exports) {
  !function(e,t){module.exports=t();}(commonjsGlobal,function(){return function(e){function t(o){if(n[o])return n[o].exports;var i=n[o]={exports:{},id:o,loaded:!1};return e[o].call(i.exports,i,i.exports,t),i.loaded=!0,i.exports}var n={};return t.m=e,t.c=n,t.p="dist/",t(0)}([function(e,t,n){function o(e){return e&&e.__esModule?e:{default:e}}var i=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(e[o]=n[o]);}return e},r=n(1),a=(o(r),n(6)),u=o(a),c=n(7),s=o(c),f=n(8),d=o(f),l=n(9),p=o(l),m=n(10),b=o(m),v=n(11),y=o(v),g=n(14),h=o(g),w=[],k=!1,x={offset:120,delay:0,easing:"ease",duration:400,disable:!1,once:!1,startEvent:"DOMContentLoaded",throttleDelay:99,debounceDelay:50,disableMutationObserver:!1},j=function(){var e=arguments.length>0&&void 0!==arguments[0]&&arguments[0];if(e&&(k=!0),k)return w=(0, y.default)(w,x),(0, b.default)(w,x.once),w},O=function(){w=(0, h.default)(),j();},M=function(){w.forEach(function(e,t){e.node.removeAttribute("data-aos"),e.node.removeAttribute("data-aos-easing"),e.node.removeAttribute("data-aos-duration"),e.node.removeAttribute("data-aos-delay");});},S=function(e){return e===!0||"mobile"===e&&p.default.mobile()||"phone"===e&&p.default.phone()||"tablet"===e&&p.default.tablet()||"function"==typeof e&&e()===!0},_=function(e){x=i(x,e),w=(0, h.default)();var t=document.all&&!window.atob;return S(x.disable)||t?M():(x.disableMutationObserver||d.default.isSupported()||(console.info('\n      aos: MutationObserver is not supported on this browser,\n      code mutations observing has been disabled.\n      You may have to call "refreshHard()" by yourself.\n    '),x.disableMutationObserver=!0),document.querySelector("body").setAttribute("data-aos-easing",x.easing),document.querySelector("body").setAttribute("data-aos-duration",x.duration),document.querySelector("body").setAttribute("data-aos-delay",x.delay),"DOMContentLoaded"===x.startEvent&&["complete","interactive"].indexOf(document.readyState)>-1?j(!0):"load"===x.startEvent?window.addEventListener(x.startEvent,function(){j(!0);}):document.addEventListener(x.startEvent,function(){j(!0);}),window.addEventListener("resize",(0, s.default)(j,x.debounceDelay,!0)),window.addEventListener("orientationchange",(0, s.default)(j,x.debounceDelay,!0)),window.addEventListener("scroll",(0, u.default)(function(){(0, b.default)(w,x.once);},x.throttleDelay)),x.disableMutationObserver||d.default.ready("[data-aos]",O),w)};e.exports={init:_,refresh:j,refreshHard:O};},function(e,t){},,,,,function(e,t){(function(t){function n(e,t,n){function o(t){var n=b,o=v;return b=v=void 0,k=t,g=e.apply(o,n)}function r(e){return k=e,h=setTimeout(f,t),M?o(e):g}function a(e){var n=e-w,o=e-k,i=t-n;return S?j(i,y-o):i}function c(e){var n=e-w,o=e-k;return void 0===w||n>=t||n<0||S&&o>=y}function f(){var e=O();return c(e)?d(e):void(h=setTimeout(f,a(e)))}function d(e){return h=void 0,_&&b?o(e):(b=v=void 0,g)}function l(){void 0!==h&&clearTimeout(h),k=0,b=w=v=h=void 0;}function p(){return void 0===h?g:d(O())}function m(){var e=O(),n=c(e);if(b=arguments,v=this,w=e,n){if(void 0===h)return r(w);if(S)return h=setTimeout(f,t),o(w)}return void 0===h&&(h=setTimeout(f,t)),g}var b,v,y,g,h,w,k=0,M=!1,S=!1,_=!0;if("function"!=typeof e)throw new TypeError(s);return t=u(t)||0,i(n)&&(M=!!n.leading,S="maxWait"in n,y=S?x(u(n.maxWait)||0,t):y,_="trailing"in n?!!n.trailing:_),m.cancel=l,m.flush=p,m}function o(e,t,o){var r=!0,a=!0;if("function"!=typeof e)throw new TypeError(s);return i(o)&&(r="leading"in o?!!o.leading:r,a="trailing"in o?!!o.trailing:a),n(e,t,{leading:r,maxWait:t,trailing:a})}function i(e){var t="undefined"==typeof e?"undefined":c(e);return !!e&&("object"==t||"function"==t)}function r(e){return !!e&&"object"==("undefined"==typeof e?"undefined":c(e))}function a(e){return "symbol"==("undefined"==typeof e?"undefined":c(e))||r(e)&&k.call(e)==d}function u(e){if("number"==typeof e)return e;if(a(e))return f;if(i(e)){var t="function"==typeof e.valueOf?e.valueOf():e;e=i(t)?t+"":t;}if("string"!=typeof e)return 0===e?e:+e;e=e.replace(l,"");var n=m.test(e);return n||b.test(e)?v(e.slice(2),n?2:8):p.test(e)?f:+e}var c="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},s="Expected a function",f=NaN,d="[object Symbol]",l=/^\s+|\s+$/g,p=/^[-+]0x[0-9a-f]+$/i,m=/^0b[01]+$/i,b=/^0o[0-7]+$/i,v=parseInt,y="object"==("undefined"==typeof t?"undefined":c(t))&&t&&t.Object===Object&&t,g="object"==("undefined"==typeof self?"undefined":c(self))&&self&&self.Object===Object&&self,h=y||g||Function("return this")(),w=Object.prototype,k=w.toString,x=Math.max,j=Math.min,O=function(){return h.Date.now()};e.exports=o;}).call(t,function(){return this}());},function(e,t){(function(t){function n(e,t,n){function i(t){var n=b,o=v;return b=v=void 0,O=t,g=e.apply(o,n)}function r(e){return O=e,h=setTimeout(f,t),M?i(e):g}function u(e){var n=e-w,o=e-O,i=t-n;return S?x(i,y-o):i}function s(e){var n=e-w,o=e-O;return void 0===w||n>=t||n<0||S&&o>=y}function f(){var e=j();return s(e)?d(e):void(h=setTimeout(f,u(e)))}function d(e){return h=void 0,_&&b?i(e):(b=v=void 0,g)}function l(){void 0!==h&&clearTimeout(h),O=0,b=w=v=h=void 0;}function p(){return void 0===h?g:d(j())}function m(){var e=j(),n=s(e);if(b=arguments,v=this,w=e,n){if(void 0===h)return r(w);if(S)return h=setTimeout(f,t),i(w)}return void 0===h&&(h=setTimeout(f,t)),g}var b,v,y,g,h,w,O=0,M=!1,S=!1,_=!0;if("function"!=typeof e)throw new TypeError(c);return t=a(t)||0,o(n)&&(M=!!n.leading,S="maxWait"in n,y=S?k(a(n.maxWait)||0,t):y,_="trailing"in n?!!n.trailing:_),m.cancel=l,m.flush=p,m}function o(e){var t="undefined"==typeof e?"undefined":u(e);return !!e&&("object"==t||"function"==t)}function i(e){return !!e&&"object"==("undefined"==typeof e?"undefined":u(e))}function r(e){return "symbol"==("undefined"==typeof e?"undefined":u(e))||i(e)&&w.call(e)==f}function a(e){if("number"==typeof e)return e;if(r(e))return s;if(o(e)){var t="function"==typeof e.valueOf?e.valueOf():e;e=o(t)?t+"":t;}if("string"!=typeof e)return 0===e?e:+e;e=e.replace(d,"");var n=p.test(e);return n||m.test(e)?b(e.slice(2),n?2:8):l.test(e)?s:+e}var u="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},c="Expected a function",s=NaN,f="[object Symbol]",d=/^\s+|\s+$/g,l=/^[-+]0x[0-9a-f]+$/i,p=/^0b[01]+$/i,m=/^0o[0-7]+$/i,b=parseInt,v="object"==("undefined"==typeof t?"undefined":u(t))&&t&&t.Object===Object&&t,y="object"==("undefined"==typeof self?"undefined":u(self))&&self&&self.Object===Object&&self,g=v||y||Function("return this")(),h=Object.prototype,w=h.toString,k=Math.max,x=Math.min,j=function(){return g.Date.now()};e.exports=n;}).call(t,function(){return this}());},function(e,t){function n(e){var t=void 0,o=void 0,i=void 0;for(t=0;t<e.length;t+=1){if(o=e[t],o.dataset&&o.dataset.aos)return !0;if(i=o.children&&n(o.children))return !0}return !1}function o(){return window.MutationObserver||window.WebKitMutationObserver||window.MozMutationObserver}function i(){return !!o()}function r(e,t){var n=window.document,i=o(),r=new i(a);u=t,r.observe(n.documentElement,{childList:!0,subtree:!0,removedNodes:!0});}function a(e){e&&e.forEach(function(e){var t=Array.prototype.slice.call(e.addedNodes),o=Array.prototype.slice.call(e.removedNodes),i=t.concat(o);if(n(i))return u()});}Object.defineProperty(t,"__esModule",{value:!0});var u=function(){};t.default={isSupported:i,ready:r};},function(e,t){function n(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function o(){return navigator.userAgent||navigator.vendor||window.opera||""}Object.defineProperty(t,"__esModule",{value:!0});var i=function(){function e(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o);}}return function(t,n,o){return n&&e(t.prototype,n),o&&e(t,o),t}}(),r=/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i,a=/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i,u=/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i,c=/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i,s=function(){function e(){n(this,e);}return i(e,[{key:"phone",value:function(){var e=o();return !(!r.test(e)&&!a.test(e.substr(0,4)))}},{key:"mobile",value:function(){var e=o();return !(!u.test(e)&&!c.test(e.substr(0,4)))}},{key:"tablet",value:function(){return this.mobile()&&!this.phone()}}]),e}();t.default=new s;},function(e,t){Object.defineProperty(t,"__esModule",{value:!0});var n=function(e,t,n){var o=e.node.getAttribute("data-aos-once");t>e.position?e.node.classList.add("aos-animate"):"undefined"!=typeof o&&("false"===o||!n&&"true"!==o)&&e.node.classList.remove("aos-animate");},o=function(e,t){var o=window.pageYOffset,i=window.innerHeight;e.forEach(function(e,r){n(e,i+o,t);});};t.default=o;},function(e,t,n){function o(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0});var i=n(12),r=o(i),a=function(e,t){return e.forEach(function(e,n){e.node.classList.add("aos-init"),e.position=(0, r.default)(e.node,t.offset);}),e};t.default=a;},function(e,t,n){function o(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0});var i=n(13),r=o(i),a=function(e,t){var n=0,o=0,i=window.innerHeight,a={offset:e.getAttribute("data-aos-offset"),anchor:e.getAttribute("data-aos-anchor"),anchorPlacement:e.getAttribute("data-aos-anchor-placement")};switch(a.offset&&!isNaN(a.offset)&&(o=parseInt(a.offset)),a.anchor&&document.querySelectorAll(a.anchor)&&(e=document.querySelectorAll(a.anchor)[0]),n=(0, r.default)(e).top,a.anchorPlacement){case"top-bottom":break;case"center-bottom":n+=e.offsetHeight/2;break;case"bottom-bottom":n+=e.offsetHeight;break;case"top-center":n+=i/2;break;case"bottom-center":n+=i/2+e.offsetHeight;break;case"center-center":n+=i/2+e.offsetHeight/2;break;case"top-top":n+=i;break;case"bottom-top":n+=e.offsetHeight+i;break;case"center-top":n+=e.offsetHeight/2+i;}return a.anchorPlacement||a.offset||isNaN(t)||(o=t),n+o};t.default=a;},function(e,t){Object.defineProperty(t,"__esModule",{value:!0});var n=function(e){for(var t=0,n=0;e&&!isNaN(e.offsetLeft)&&!isNaN(e.offsetTop);)t+=e.offsetLeft-("BODY"!=e.tagName?e.scrollLeft:0),n+=e.offsetTop-("BODY"!=e.tagName?e.scrollTop:0),e=e.offsetParent;return {top:n,left:t}};t.default=n;},function(e,t){Object.defineProperty(t,"__esModule",{value:!0});var n=function(e){return e=e||document.querySelectorAll("[data-aos]"),Array.prototype.map.call(e,function(e){return {node:e}})};t.default=n;}])});
  });

  var aos$1 = /*@__PURE__*/getDefaultExportFromCjs(aos);

  var squirrelly_min = createCommonjsModule(function (module, exports) {
  !function(e,t){t(exports);}(commonjsGlobal,(function(e){function t(e){var n,r,a=new Error(e);return n=a,r=t.prototype,Object.setPrototypeOf?Object.setPrototypeOf(n,r):n.__proto__=r,a}function n(e,n,r){var a=n.slice(0,r).split(/\n/),i=a.length,s=a[i-1].length+1;throw t(e+=" at line "+i+" col "+s+":\n\n  "+n.split(/\n/)[i-1]+"\n  "+Array(s).join(" ")+"^")}t.prototype=Object.create(Error.prototype,{name:{value:"Squirrelly Error",enumerable:!1}});var r=new Function("return this")().Promise,a=!1;try{a=new Function("return (async function(){}).constructor")();}catch(e){if(!(e instanceof SyntaxError))throw e}function i(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function s(e,t,n){for(var r in t)i(t,r)&&(null==t[r]||"object"!=typeof t[r]||"storage"!==r&&"prefixes"!==r||n?e[r]=t[r]:e[r]=s({},t[r]));return e}var c=/^async +/,o=/`(?:\\[\s\S]|\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})*}|(?!\${)[^\\`])*`/g,l=/'(?:\\[\s\w"'\\`]|[^\n\r'\\])*?'/g,f=/"(?:\\[\s\w"'\\`]|[^\n\r"\\])*?"/g,u=/[.*+\-?^${}()|[\]\\]/g;function p(e){return u.test(e)?e.replace(u,"\\$&"):e}function h(e,r){r.rmWhitespace&&(e=e.replace(/[\r\n]+/g,"\n").replace(/^\s+|\s+$/gm,"")),o.lastIndex=0,l.lastIndex=0,f.lastIndex=0;var a=r.prefixes,i=[a.h,a.b,a.i,a.r,a.c,a.e].reduce((function(e,t){return e&&t?e+"|"+p(t):t?p(t):e}),""),s=new RegExp("([|()]|=>)|('|\"|`|\\/\\*)|\\s*((\\/)?(-|_)?"+p(r.tags[1])+")","g"),u=new RegExp("([^]*?)"+p(r.tags[0])+"(-|_)?\\s*("+i+")?\\s*","g"),h=0,d=!1;function g(t,a){var i,p={f:[]},g=0,v="c";function m(t){var a=e.slice(h,t),i=a.trim();if("f"===v)"safe"===i?p.raw=!0:r.async&&c.test(i)?(i=i.replace(c,""),p.f.push([i,"",!0])):p.f.push([i,""]);else if("fp"===v)p.f[p.f.length-1][1]+=i;else if("err"===v){if(i){var s=a.search(/\S/);n("invalid syntax",e,h+s);}}else p[v]=i;h=t+1;}for("h"===a||"b"===a||"c"===a?v="n":"r"===a&&(p.raw=!0,a="i"),s.lastIndex=h;null!==(i=s.exec(e));){var y=i[1],x=i[2],b=i[3],w=i[4],F=i[5],S=i.index;if(y)"("===y?(0===g&&("n"===v?(m(S),v="p"):"f"===v&&(m(S),v="fp")),g++):")"===y?0===--g&&"c"!==v&&(m(S),v="err"):0===g&&"|"===y?(m(S),v="f"):"=>"===y&&(m(S),h+=1,v="res");else if(x){if("/*"===x){var I=e.indexOf("*/",s.lastIndex);-1===I&&n("unclosed comment",e,i.index),s.lastIndex=I+2;}else if("'"===x){l.lastIndex=i.index,l.exec(e)?s.lastIndex=l.lastIndex:n("unclosed string",e,i.index);}else if('"'===x){f.lastIndex=i.index,f.exec(e)?s.lastIndex=f.lastIndex:n("unclosed string",e,i.index);}else if("`"===x){o.lastIndex=i.index,o.exec(e)?s.lastIndex=o.lastIndex:n("unclosed string",e,i.index);}}else if(b)return m(S),h=S+i[0].length,u.lastIndex=h,d=F,w&&"h"===a&&(a="s"),p.t=a,p}return n("unclosed tag",e,t),p}var v=function i(s,o){s.b=[],s.d=[];var l,f=!1,p=[];function v(e,t){e&&(e=function(e,t,n,r){var a,i;return "string"==typeof t.autoTrim?a=i=t.autoTrim:Array.isArray(t.autoTrim)&&(a=t.autoTrim[1],i=t.autoTrim[0]),(n||!1===n)&&(a=n),(r||!1===r)&&(i=r),"slurp"===a&&"slurp"===i?e.trim():("_"===a||"slurp"===a?e=String.prototype.trimLeft?e.trimLeft():e.replace(/^[\s\uFEFF\xA0]+/,""):"-"!==a&&"nl"!==a||(e=e.replace(/^(?:\n|\r|\r\n)/,"")),"_"===i||"slurp"===i?e=String.prototype.trimRight?e.trimRight():e.replace(/[\s\uFEFF\xA0]+$/,""):"-"!==i&&"nl"!==i||(e=e.replace(/(?:\n|\r|\r\n)$/,"")),e)}(e,r,d,t))&&(e=e.replace(/\\|'/g,"\\$&").replace(/\r\n|\n|\r/g,"\\n"),p.push(e));}for(;null!==(l=u.exec(e));){var m,y=l[1],x=l[2],b=l[3]||"";for(var w in a)if(a[w]===b){m=w;break}v(y,x),h=l.index+l[0].length,m||n("unrecognized tag type: "+b,e,h);var F=g(l.index,m),S=F.t;if("h"===S){var I=F.n||"";r.async&&c.test(I)&&(F.a=!0,F.n=I.replace(c,"")),F=i(F),p.push(F);}else if("c"===S){if(s.n===F.n)return f?(f.d=p,s.b.push(f)):s.d=p,s;n("Helper start and end don't match",e,l.index+l[0].length);}else if("b"===S){f?(f.d=p,s.b.push(f)):s.d=p;var R=F.n||"";r.async&&c.test(R)&&(F.a=!0,F.n=R.replace(c,"")),f=F,p=[];}else if("s"===S){var T=F.n||"";r.async&&c.test(T)&&(F.a=!0,F.n=T.replace(c,"")),p.push(F);}else p.push(F);}if(!o)throw t('unclosed helper "'+s.n+'"');return v(e.slice(h,e.length),!1),s.d=p,s}({f:[]},!0);if(r.plugins)for(var m=0;m<r.plugins.length;m++){var y=r.plugins[m];y.processAST&&(v.d=y.processAST(v.d,r));}return v.d}function d(e,t){var n=h(e,t),r="var tR='';"+(t.useWith?"with("+t.varName+"||{}){":"")+x(n,t)+"if(cb){cb(null,tR)} return tR"+(t.useWith?"}":"");if(t.plugins)for(var a=0;a<t.plugins.length;a++){var i=t.plugins[a];i.processFnString&&(r=i.processFnString(r,t));}return r}function g(e,t){for(var n=0;n<t.length;n++){var r=t[n][0],a=t[n][1];e=(t[n][2]?"await ":"")+"c.l('F','"+r+"')("+e,a&&(e+=","+a),e+=")";}return e}function v(e,t,n,r,a,i){var s="{exec:"+(a?"async ":"")+y(n,t,e)+",params:["+r+"]";return i&&(s+=",name:'"+i+"'"),a&&(s+=",async:true"),s+="}"}function m(e,t){for(var n="[",r=0;r<e.length;r++){var a=e[r];n+=v(t,a.res||"",a.d,a.p||"",a.a,a.n),r<e.length&&(n+=",");}return n+="]"}function y(e,t,n){return "function("+t+"){var tR='';"+x(e,n)+"return tR}"}function x(e,t){for(var n=0,r=e.length,a="";n<r;n++){var i=e[n];if("string"==typeof i){a+="tR+='"+i+"';";}else {var s=i.t,c=i.c||"",o=i.f,l=i.n||"",f=i.p||"",u=i.res||"",p=i.b,h=!!i.a;if("i"===s){t.defaultFilter&&(c="c.l('F','"+t.defaultFilter+"')("+c+")");var d=g(c,o);!i.raw&&t.autoEscape&&(d="c.l('F','e')("+d+")"),a+="tR+="+d+";";}else if("h"===s)if(t.storage.nativeHelpers.get(l))a+=t.storage.nativeHelpers.get(l)(i,t);else {var y=(h?"await ":"")+"c.l('H','"+l+"')("+v(t,u,i.d,f,h);y+=p?","+m(p,t):",[]",a+="tR+="+g(y+=",c)",o)+";";}else "s"===s?a+="tR+="+g((h?"await ":"")+"c.l('H','"+l+"')({params:["+f+"]},[],c)",o)+";":"e"===s&&(a+=c+"\n");}}return a}var b=function(){function e(e){this.cache=e;}return e.prototype.define=function(e,t){this.cache[e]=t;},e.prototype.get=function(e){return this.cache[e]},e.prototype.remove=function(e){delete this.cache[e];},e.prototype.reset=function(){this.cache={};},e.prototype.load=function(e){s(this.cache,e,!0);},e}();function w(e,n,r,a){if(n&&n.length>0)throw t((a?"Native":"")+"Helper '"+e+"' doesn't accept blocks");if(r&&r.length>0)throw t((a?"Native":"")+"Helper '"+e+"' doesn't accept filters")}var F={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};function S(e){return F[e]}var I=new b({}),R=new b({each:function(e,t){var n="",r=e.params[0];if(w("each",t,!1),e.async)return new Promise((function(t){!function e(t,n,r,a,i){r(t[n],n).then((function(s){a+=s,n===t.length-1?i(a):e(t,n+1,r,a,i);}));}(r,0,e.exec,n,t);}));for(var a=0;a<r.length;a++)n+=e.exec(r[a],a);return n},foreach:function(e,t){var n=e.params[0];if(w("foreach",t,!1),e.async)return new Promise((function(t){!function e(t,n,r,a,i,s){a(n[r],t[n[r]]).then((function(c){i+=c,r===n.length-1?s(i):e(t,n,r+1,a,i,s);}));}(n,Object.keys(n),0,e.exec,"",t);}));var r="";for(var a in n)i(n,a)&&(r+=e.exec(a,n[a]));return r},include:function(e,n,r){w("include",n,!1);var a=r.storage.templates.get(e.params[0]);if(!a)throw t('Could not fetch template "'+e.params[0]+'"');return a(e.params[1],r)},extends:function(e,n,r){var a=e.params[1]||{};a.content=e.exec();for(var i=0;i<n.length;i++){var s=n[i];a[s.name]=s.exec();}var c=r.storage.templates.get(e.params[0]);if(!c)throw t('Could not fetch template "'+e.params[0]+'"');return c(a,r)},useScope:function(e,t){return w("useScope",t,!1),e.exec(e.params[0])}}),T=new b({if:function(e,t){w("if",!1,e.f,!0);var n="if("+e.p+"){"+x(e.d,t)+"}";if(e.b)for(var r=0;r<e.b.length;r++){var a=e.b[r];"else"===a.n?n+="else{"+x(a.d,t)+"}":"elif"===a.n&&(n+="else if("+a.p+"){"+x(a.d,t)+"}");}return n},try:function(e,n){if(w("try",!1,e.f,!0),!e.b||1!==e.b.length||"catch"!==e.b[0].n)throw t("native helper 'try' only accepts 1 block, 'catch'");var r="try{"+x(e.d,n)+"}",a=e.b[0];return r+="catch"+(a.res?"("+a.res+")":"")+"{"+x(a.d,n)+"}"},block:function(e,t){return w("block",e.b,e.f,!0),"if(!"+t.varName+"["+e.p+"]){tR+=("+y(e.d,"",t)+")()}else{tR+="+t.varName+"["+e.p+"]}"}}),E=new b({e:function(e){var t=String(e);return /[&<>"']/.test(t)?t.replace(/[&<>"']/g,S):t}}),j={varName:"it",autoTrim:[!1,"nl"],autoEscape:!0,defaultFilter:!1,tags:["{{","}}"],l:function(e,n){if("H"===e){var r=this.storage.helpers.get(n);if(r)return r;throw t("Can't find helper '"+n+"'")}if("F"===e){var a=this.storage.filters.get(n);if(a)return a;throw t("Can't find filter '"+n+"'")}},async:!1,storage:{helpers:R,nativeHelpers:T,filters:E,templates:I},prefixes:{h:"@",b:"#",i:"",r:"*",c:"/",e:"!"},cache:!1,plugins:[],useWith:!1};function H(e,t){var n={};return s(n,j),t&&s(n,t),e&&s(n,e),n.l.bind(n),n}function O(e,n){var r=H(n||{}),i=Function;if(r.async){if(!a)throw t("This environment doesn't support async/await");i=a;}try{return new i(r.varName,"c","cb",d(e,r))}catch(n){throw n instanceof SyntaxError?t("Bad template syntax\n\n"+n.message+"\n"+Array(n.message.length+1).join("=")+"\n"+d(e,r)):n}}function _(e,t){var n;return t.cache&&t.name&&t.storage.templates.get(t.name)?t.storage.templates.get(t.name):(n="function"==typeof e?e:O(e,t),t.cache&&t.name&&t.storage.templates.define(t.name,n),n)}j.l.bind(j),e.compile=O,e.compileScope=x,e.compileScopeIntoFunction=y,e.compileToString=d,e.defaultConfig=j,e.filters=E,e.getConfig=H,e.helpers=R,e.nativeHelpers=T,e.parse=h,e.render=function(e,n,a,i){var s=H(a||{});if(!s.async)return _(e,s)(n,s);if(!i){if("function"==typeof r)return new r((function(t,r){try{t(_(e,s)(n,s));}catch(e){r(e);}}));throw t("Please provide a callback function, this env doesn't support Promises")}try{_(e,s)(n,s,i);}catch(e){return i(e)}},e.templates=I,Object.defineProperty(e,"__esModule",{value:!0});}));

  });

  var squirrelly_min$1 = /*@__PURE__*/getDefaultExportFromCjs(squirrelly_min);

  var squirrelly_min$2 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.assign(/*#__PURE__*/Object.create(null), squirrelly_min, {
    'default': squirrelly_min$1
  }));

  /**
   * EvEmitter v1.1.0
   * Lil' event emitter
   * MIT License
   */

  var evEmitter = createCommonjsModule(function (module) {
  /* jshint unused: true, undef: true, strict: true */

  ( function( global, factory ) {
    // universal module definition
    /* jshint strict: false */ /* globals define, module, window */
    if (  module.exports ) {
      // CommonJS - Browserify, Webpack
      module.exports = factory();
    } else {
      // Browser globals
      global.EvEmitter = factory();
    }

  }( typeof window != 'undefined' ? window : commonjsGlobal, function() {

  function EvEmitter() {}

  var proto = EvEmitter.prototype;

  proto.on = function( eventName, listener ) {
    if ( !eventName || !listener ) {
      return;
    }
    // set events hash
    var events = this._events = this._events || {};
    // set listeners array
    var listeners = events[ eventName ] = events[ eventName ] || [];
    // only add once
    if ( listeners.indexOf( listener ) == -1 ) {
      listeners.push( listener );
    }

    return this;
  };

  proto.once = function( eventName, listener ) {
    if ( !eventName || !listener ) {
      return;
    }
    // add event
    this.on( eventName, listener );
    // set once flag
    // set onceEvents hash
    var onceEvents = this._onceEvents = this._onceEvents || {};
    // set onceListeners object
    var onceListeners = onceEvents[ eventName ] = onceEvents[ eventName ] || {};
    // set flag
    onceListeners[ listener ] = true;

    return this;
  };

  proto.off = function( eventName, listener ) {
    var listeners = this._events && this._events[ eventName ];
    if ( !listeners || !listeners.length ) {
      return;
    }
    var index = listeners.indexOf( listener );
    if ( index != -1 ) {
      listeners.splice( index, 1 );
    }

    return this;
  };

  proto.emitEvent = function( eventName, args ) {
    var listeners = this._events && this._events[ eventName ];
    if ( !listeners || !listeners.length ) {
      return;
    }
    // copy over to avoid interference if .off() in listener
    listeners = listeners.slice(0);
    args = args || [];
    // once stuff
    var onceListeners = this._onceEvents && this._onceEvents[ eventName ];

    for ( var i=0; i < listeners.length; i++ ) {
      var listener = listeners[i];
      var isOnce = onceListeners && onceListeners[ listener ];
      if ( isOnce ) {
        // remove listener
        // remove before trigger to prevent recursion
        this.off( eventName, listener );
        // unset once flag
        delete onceListeners[ listener ];
      }
      // trigger listener
      listener.apply( this, args );
    }

    return this;
  };

  proto.allOff = function() {
    delete this._events;
    delete this._onceEvents;
  };

  return EvEmitter;

  }));
  });

  /*!
   * getSize v2.0.3
   * measure size of elements
   * MIT license
   */

  var getSize = createCommonjsModule(function (module) {
  /* jshint browser: true, strict: true, undef: true, unused: true */
  /* globals console: false */

  ( function( window, factory ) {
    /* jshint strict: false */ /* globals define, module */
    if (  module.exports ) {
      // CommonJS
      module.exports = factory();
    } else {
      // browser global
      window.getSize = factory();
    }

  })( window, function factory() {

  // -------------------------- helpers -------------------------- //

  // get a number from a string, not a percentage
  function getStyleSize( value ) {
    var num = parseFloat( value );
    // not a percent like '100%', and a number
    var isValid = value.indexOf('%') == -1 && !isNaN( num );
    return isValid && num;
  }

  function noop() {}

  var logError = typeof console == 'undefined' ? noop :
    function( message ) {
      console.error( message );
    };

  // -------------------------- measurements -------------------------- //

  var measurements = [
    'paddingLeft',
    'paddingRight',
    'paddingTop',
    'paddingBottom',
    'marginLeft',
    'marginRight',
    'marginTop',
    'marginBottom',
    'borderLeftWidth',
    'borderRightWidth',
    'borderTopWidth',
    'borderBottomWidth'
  ];

  var measurementsLength = measurements.length;

  function getZeroSize() {
    var size = {
      width: 0,
      height: 0,
      innerWidth: 0,
      innerHeight: 0,
      outerWidth: 0,
      outerHeight: 0
    };
    for ( var i=0; i < measurementsLength; i++ ) {
      var measurement = measurements[i];
      size[ measurement ] = 0;
    }
    return size;
  }

  // -------------------------- getStyle -------------------------- //

  /**
   * getStyle, get style of element, check for Firefox bug
   * https://bugzilla.mozilla.org/show_bug.cgi?id=548397
   */
  function getStyle( elem ) {
    var style = getComputedStyle( elem );
    if ( !style ) {
      logError( 'Style returned ' + style +
        '. Are you running this code in a hidden iframe on Firefox? ' +
        'See https://bit.ly/getsizebug1' );
    }
    return style;
  }

  // -------------------------- setup -------------------------- //

  var isSetup = false;

  var isBoxSizeOuter;

  /**
   * setup
   * check isBoxSizerOuter
   * do on first getSize() rather than on page load for Firefox bug
   */
  function setup() {
    // setup once
    if ( isSetup ) {
      return;
    }
    isSetup = true;

    // -------------------------- box sizing -------------------------- //

    /**
     * Chrome & Safari measure the outer-width on style.width on border-box elems
     * IE11 & Firefox<29 measures the inner-width
     */
    var div = document.createElement('div');
    div.style.width = '200px';
    div.style.padding = '1px 2px 3px 4px';
    div.style.borderStyle = 'solid';
    div.style.borderWidth = '1px 2px 3px 4px';
    div.style.boxSizing = 'border-box';

    var body = document.body || document.documentElement;
    body.appendChild( div );
    var style = getStyle( div );
    // round value for browser zoom. desandro/masonry#928
    isBoxSizeOuter = Math.round( getStyleSize( style.width ) ) == 200;
    getSize.isBoxSizeOuter = isBoxSizeOuter;

    body.removeChild( div );
  }

  // -------------------------- getSize -------------------------- //

  function getSize( elem ) {
    setup();

    // use querySeletor if elem is string
    if ( typeof elem == 'string' ) {
      elem = document.querySelector( elem );
    }

    // do not proceed on non-objects
    if ( !elem || typeof elem != 'object' || !elem.nodeType ) {
      return;
    }

    var style = getStyle( elem );

    // if hidden, everything is 0
    if ( style.display == 'none' ) {
      return getZeroSize();
    }

    var size = {};
    size.width = elem.offsetWidth;
    size.height = elem.offsetHeight;

    var isBorderBox = size.isBorderBox = style.boxSizing == 'border-box';

    // get all measurements
    for ( var i=0; i < measurementsLength; i++ ) {
      var measurement = measurements[i];
      var value = style[ measurement ];
      var num = parseFloat( value );
      // any 'auto', 'medium' value will be 0
      size[ measurement ] = !isNaN( num ) ? num : 0;
    }

    var paddingWidth = size.paddingLeft + size.paddingRight;
    var paddingHeight = size.paddingTop + size.paddingBottom;
    var marginWidth = size.marginLeft + size.marginRight;
    var marginHeight = size.marginTop + size.marginBottom;
    var borderWidth = size.borderLeftWidth + size.borderRightWidth;
    var borderHeight = size.borderTopWidth + size.borderBottomWidth;

    var isBorderBoxSizeOuter = isBorderBox && isBoxSizeOuter;

    // overwrite width and height if we can get it from style
    var styleWidth = getStyleSize( style.width );
    if ( styleWidth !== false ) {
      size.width = styleWidth +
        // add padding and border unless it's already including it
        ( isBorderBoxSizeOuter ? 0 : paddingWidth + borderWidth );
    }

    var styleHeight = getStyleSize( style.height );
    if ( styleHeight !== false ) {
      size.height = styleHeight +
        // add padding and border unless it's already including it
        ( isBorderBoxSizeOuter ? 0 : paddingHeight + borderHeight );
    }

    size.innerWidth = size.width - ( paddingWidth + borderWidth );
    size.innerHeight = size.height - ( paddingHeight + borderHeight );

    size.outerWidth = size.width + marginWidth;
    size.outerHeight = size.height + marginHeight;

    return size;
  }

  return getSize;

  });
  });

  /**
   * matchesSelector v2.0.2
   * matchesSelector( element, '.selector' )
   * MIT license
   */

  var matchesSelector = createCommonjsModule(function (module) {
  /*jshint browser: true, strict: true, undef: true, unused: true */

  ( function( window, factory ) {
    // universal module definition
    if (  module.exports ) {
      // CommonJS
      module.exports = factory();
    } else {
      // browser global
      window.matchesSelector = factory();
    }

  }( window, function factory() {

    var matchesMethod = ( function() {
      var ElemProto = window.Element.prototype;
      // check for the standard method name first
      if ( ElemProto.matches ) {
        return 'matches';
      }
      // check un-prefixed
      if ( ElemProto.matchesSelector ) {
        return 'matchesSelector';
      }
      // check vendor prefixes
      var prefixes = [ 'webkit', 'moz', 'ms', 'o' ];

      for ( var i=0; i < prefixes.length; i++ ) {
        var prefix = prefixes[i];
        var method = prefix + 'MatchesSelector';
        if ( ElemProto[ method ] ) {
          return method;
        }
      }
    })();

    return function matchesSelector( elem, selector ) {
      return elem[ matchesMethod ]( selector );
    };

  }));
  });

  /**
   * Fizzy UI utils v2.0.7
   * MIT license
   */

  var utils = createCommonjsModule(function (module) {
  /*jshint browser: true, undef: true, unused: true, strict: true */

  ( function( window, factory ) {
    // universal module definition
    /*jshint strict: false */ /*globals define, module, require */

    if (  module.exports ) {
      // CommonJS
      module.exports = factory(
        window,
        matchesSelector
      );
    } else {
      // browser global
      window.fizzyUIUtils = factory(
        window,
        window.matchesSelector
      );
    }

  }( window, function factory( window, matchesSelector ) {

  var utils = {};

  // ----- extend ----- //

  // extends objects
  utils.extend = function( a, b ) {
    for ( var prop in b ) {
      a[ prop ] = b[ prop ];
    }
    return a;
  };

  // ----- modulo ----- //

  utils.modulo = function( num, div ) {
    return ( ( num % div ) + div ) % div;
  };

  // ----- makeArray ----- //

  var arraySlice = Array.prototype.slice;

  // turn element or nodeList into an array
  utils.makeArray = function( obj ) {
    if ( Array.isArray( obj ) ) {
      // use object if already an array
      return obj;
    }
    // return empty array if undefined or null. #6
    if ( obj === null || obj === undefined ) {
      return [];
    }

    var isArrayLike = typeof obj == 'object' && typeof obj.length == 'number';
    if ( isArrayLike ) {
      // convert nodeList to array
      return arraySlice.call( obj );
    }

    // array of single index
    return [ obj ];
  };

  // ----- removeFrom ----- //

  utils.removeFrom = function( ary, obj ) {
    var index = ary.indexOf( obj );
    if ( index != -1 ) {
      ary.splice( index, 1 );
    }
  };

  // ----- getParent ----- //

  utils.getParent = function( elem, selector ) {
    while ( elem.parentNode && elem != document.body ) {
      elem = elem.parentNode;
      if ( matchesSelector( elem, selector ) ) {
        return elem;
      }
    }
  };

  // ----- getQueryElement ----- //

  // use element as selector string
  utils.getQueryElement = function( elem ) {
    if ( typeof elem == 'string' ) {
      return document.querySelector( elem );
    }
    return elem;
  };

  // ----- handleEvent ----- //

  // enable .ontype to trigger from .addEventListener( elem, 'type' )
  utils.handleEvent = function( event ) {
    var method = 'on' + event.type;
    if ( this[ method ] ) {
      this[ method ]( event );
    }
  };

  // ----- filterFindElements ----- //

  utils.filterFindElements = function( elems, selector ) {
    // make array of elems
    elems = utils.makeArray( elems );
    var ffElems = [];

    elems.forEach( function( elem ) {
      // check that elem is an actual element
      if ( !( elem instanceof HTMLElement ) ) {
        return;
      }
      // add elem if no selector
      if ( !selector ) {
        ffElems.push( elem );
        return;
      }
      // filter & find items if we have a selector
      // filter
      if ( matchesSelector( elem, selector ) ) {
        ffElems.push( elem );
      }
      // find children
      var childElems = elem.querySelectorAll( selector );
      // concat childElems to filterFound array
      for ( var i=0; i < childElems.length; i++ ) {
        ffElems.push( childElems[i] );
      }
    });

    return ffElems;
  };

  // ----- debounceMethod ----- //

  utils.debounceMethod = function( _class, methodName, threshold ) {
    threshold = threshold || 100;
    // original method
    var method = _class.prototype[ methodName ];
    var timeoutName = methodName + 'Timeout';

    _class.prototype[ methodName ] = function() {
      var timeout = this[ timeoutName ];
      clearTimeout( timeout );

      var args = arguments;
      var _this = this;
      this[ timeoutName ] = setTimeout( function() {
        method.apply( _this, args );
        delete _this[ timeoutName ];
      }, threshold );
    };
  };

  // ----- docReady ----- //

  utils.docReady = function( callback ) {
    var readyState = document.readyState;
    if ( readyState == 'complete' || readyState == 'interactive' ) {
      // do async to allow for other scripts to run. metafizzy/flickity#441
      setTimeout( callback );
    } else {
      document.addEventListener( 'DOMContentLoaded', callback );
    }
  };

  // ----- htmlInit ----- //

  // http://jamesroberts.name/blog/2010/02/22/string-functions-for-javascript-trim-to-camel-case-to-dashed-and-to-underscore/
  utils.toDashed = function( str ) {
    return str.replace( /(.)([A-Z])/g, function( match, $1, $2 ) {
      return $1 + '-' + $2;
    }).toLowerCase();
  };

  var console = window.console;
  /**
   * allow user to initialize classes via [data-namespace] or .js-namespace class
   * htmlInit( Widget, 'widgetName' )
   * options are parsed from data-namespace-options
   */
  utils.htmlInit = function( WidgetClass, namespace ) {
    utils.docReady( function() {
      var dashedNamespace = utils.toDashed( namespace );
      var dataAttr = 'data-' + dashedNamespace;
      var dataAttrElems = document.querySelectorAll( '[' + dataAttr + ']' );
      var jsDashElems = document.querySelectorAll( '.js-' + dashedNamespace );
      var elems = utils.makeArray( dataAttrElems )
        .concat( utils.makeArray( jsDashElems ) );
      var dataOptionsAttr = dataAttr + '-options';
      var jQuery = window.jQuery;

      elems.forEach( function( elem ) {
        var attr = elem.getAttribute( dataAttr ) ||
          elem.getAttribute( dataOptionsAttr );
        var options;
        try {
          options = attr && JSON.parse( attr );
        } catch ( error ) {
          // log error, do not initialize
          if ( console ) {
            console.error( 'Error parsing ' + dataAttr + ' on ' + elem.className +
            ': ' + error );
          }
          return;
        }
        // initialize
        var instance = new WidgetClass( elem, options );
        // make available via $().data('namespace')
        if ( jQuery ) {
          jQuery.data( elem, namespace, instance );
        }
      });

    });
  };

  // -----  ----- //

  return utils;

  }));
  });

  var cell = createCommonjsModule(function (module) {
  // Flickity.Cell
  ( function( window, factory ) {
    // universal module definition
    if (  module.exports ) {
      // CommonJS
      module.exports = factory(
          window,
          getSize
      );
    } else {
      // browser global
      window.Flickity = window.Flickity || {};
      window.Flickity.Cell = factory(
          window,
          window.getSize
      );
    }

  }( window, function factory( window, getSize ) {

  function Cell( elem, parent ) {
    this.element = elem;
    this.parent = parent;

    this.create();
  }

  var proto = Cell.prototype;

  proto.create = function() {
    this.element.style.position = 'absolute';
    this.element.setAttribute( 'aria-hidden', 'true' );
    this.x = 0;
    this.shift = 0;
    this.element.style[ this.parent.originSide ] = 0;
  };

  proto.destroy = function() {
    // reset style
    this.unselect();
    this.element.style.position = '';
    var side = this.parent.originSide;
    this.element.style[ side ] = '';
    this.element.style.transform = '';
    this.element.removeAttribute('aria-hidden');
  };

  proto.getSize = function() {
    this.size = getSize( this.element );
  };

  proto.setPosition = function( x ) {
    this.x = x;
    this.updateTarget();
    this.renderPosition( x );
  };

  // setDefaultTarget v1 method, backwards compatibility, remove in v3
  proto.updateTarget = proto.setDefaultTarget = function() {
    var marginProperty = this.parent.originSide == 'left' ? 'marginLeft' : 'marginRight';
    this.target = this.x + this.size[ marginProperty ] +
      this.size.width * this.parent.cellAlign;
  };

  proto.renderPosition = function( x ) {
    // render position of cell with in slider
    var sideOffset = this.parent.originSide === 'left' ? 1 : -1;

    var adjustedX = this.parent.options.percentPosition ?
      x * sideOffset * ( this.parent.size.innerWidth / this.size.width ) :
      x * sideOffset;

    this.element.style.transform = 'translateX(' +
      this.parent.getPositionValue( adjustedX ) + ')';
  };

  proto.select = function() {
    this.element.classList.add('is-selected');
    this.element.removeAttribute('aria-hidden');
  };

  proto.unselect = function() {
    this.element.classList.remove('is-selected');
    this.element.setAttribute( 'aria-hidden', 'true' );
  };

  /**
   * @param {Integer} shift - 0, 1, or -1
   */
  proto.wrapShift = function( shift ) {
    this.shift = shift;
    this.renderPosition( this.x + this.parent.slideableWidth * shift );
  };

  proto.remove = function() {
    this.element.parentNode.removeChild( this.element );
  };

  return Cell;

  } ) );
  });

  var slide = createCommonjsModule(function (module) {
  // slide
  ( function( window, factory ) {
    // universal module definition
    if (  module.exports ) {
      // CommonJS
      module.exports = factory();
    } else {
      // browser global
      window.Flickity = window.Flickity || {};
      window.Flickity.Slide = factory();
    }

  }( window, function factory() {

  function Slide( parent ) {
    this.parent = parent;
    this.isOriginLeft = parent.originSide == 'left';
    this.cells = [];
    this.outerWidth = 0;
    this.height = 0;
  }

  var proto = Slide.prototype;

  proto.addCell = function( cell ) {
    this.cells.push( cell );
    this.outerWidth += cell.size.outerWidth;
    this.height = Math.max( cell.size.outerHeight, this.height );
    // first cell stuff
    if ( this.cells.length == 1 ) {
      this.x = cell.x; // x comes from first cell
      var beginMargin = this.isOriginLeft ? 'marginLeft' : 'marginRight';
      this.firstMargin = cell.size[ beginMargin ];
    }
  };

  proto.updateTarget = function() {
    var endMargin = this.isOriginLeft ? 'marginRight' : 'marginLeft';
    var lastCell = this.getLastCell();
    var lastMargin = lastCell ? lastCell.size[ endMargin ] : 0;
    var slideWidth = this.outerWidth - ( this.firstMargin + lastMargin );
    this.target = this.x + this.firstMargin + slideWidth * this.parent.cellAlign;
  };

  proto.getLastCell = function() {
    return this.cells[ this.cells.length - 1 ];
  };

  proto.select = function() {
    this.cells.forEach( function( cell ) {
      cell.select();
    } );
  };

  proto.unselect = function() {
    this.cells.forEach( function( cell ) {
      cell.unselect();
    } );
  };

  proto.getCellElements = function() {
    return this.cells.map( function( cell ) {
      return cell.element;
    } );
  };

  return Slide;

  } ) );
  });

  var animate = createCommonjsModule(function (module) {
  // animate
  ( function( window, factory ) {
    // universal module definition
    if (  module.exports ) {
      // CommonJS
      module.exports = factory(
          window,
          utils
      );
    } else {
      // browser global
      window.Flickity = window.Flickity || {};
      window.Flickity.animatePrototype = factory(
          window,
          window.fizzyUIUtils
      );
    }

  }( window, function factory( window, utils ) {

  // -------------------------- animate -------------------------- //

  var proto = {};

  proto.startAnimation = function() {
    if ( this.isAnimating ) {
      return;
    }

    this.isAnimating = true;
    this.restingFrames = 0;
    this.animate();
  };

  proto.animate = function() {
    this.applyDragForce();
    this.applySelectedAttraction();

    var previousX = this.x;

    this.integratePhysics();
    this.positionSlider();
    this.settle( previousX );
    // animate next frame
    if ( this.isAnimating ) {
      var _this = this;
      requestAnimationFrame( function animateFrame() {
        _this.animate();
      } );
    }
  };

  proto.positionSlider = function() {
    var x = this.x;
    // wrap position around
    if ( this.options.wrapAround && this.cells.length > 1 ) {
      x = utils.modulo( x, this.slideableWidth );
      x -= this.slideableWidth;
      this.shiftWrapCells( x );
    }

    this.setTranslateX( x, this.isAnimating );
    this.dispatchScrollEvent();
  };

  proto.setTranslateX = function( x, is3d ) {
    x += this.cursorPosition;
    // reverse if right-to-left and using transform
    x = this.options.rightToLeft ? -x : x;
    var translateX = this.getPositionValue( x );
    // use 3D transforms for hardware acceleration on iOS
    // but use 2D when settled, for better font-rendering
    this.slider.style.transform = is3d ?
      'translate3d(' + translateX + ',0,0)' : 'translateX(' + translateX + ')';
  };

  proto.dispatchScrollEvent = function() {
    var firstSlide = this.slides[0];
    if ( !firstSlide ) {
      return;
    }
    var positionX = -this.x - firstSlide.target;
    var progress = positionX / this.slidesWidth;
    this.dispatchEvent( 'scroll', null, [ progress, positionX ] );
  };

  proto.positionSliderAtSelected = function() {
    if ( !this.cells.length ) {
      return;
    }
    this.x = -this.selectedSlide.target;
    this.velocity = 0; // stop wobble
    this.positionSlider();
  };

  proto.getPositionValue = function( position ) {
    if ( this.options.percentPosition ) {
      // percent position, round to 2 digits, like 12.34%
      return ( Math.round( ( position / this.size.innerWidth ) * 10000 ) * 0.01 ) + '%';
    } else {
      // pixel positioning
      return Math.round( position ) + 'px';
    }
  };

  proto.settle = function( previousX ) {
    // keep track of frames where x hasn't moved
    var isResting = !this.isPointerDown &&
        Math.round( this.x * 100 ) == Math.round( previousX * 100 );
    if ( isResting ) {
      this.restingFrames++;
    }
    // stop animating if resting for 3 or more frames
    if ( this.restingFrames > 2 ) {
      this.isAnimating = false;
      delete this.isFreeScrolling;
      // render position with translateX when settled
      this.positionSlider();
      this.dispatchEvent( 'settle', null, [ this.selectedIndex ] );
    }
  };

  proto.shiftWrapCells = function( x ) {
    // shift before cells
    var beforeGap = this.cursorPosition + x;
    this._shiftCells( this.beforeShiftCells, beforeGap, -1 );
    // shift after cells
    var afterGap = this.size.innerWidth - ( x + this.slideableWidth + this.cursorPosition );
    this._shiftCells( this.afterShiftCells, afterGap, 1 );
  };

  proto._shiftCells = function( cells, gap, shift ) {
    for ( var i = 0; i < cells.length; i++ ) {
      var cell = cells[i];
      var cellShift = gap > 0 ? shift : 0;
      cell.wrapShift( cellShift );
      gap -= cell.size.outerWidth;
    }
  };

  proto._unshiftCells = function( cells ) {
    if ( !cells || !cells.length ) {
      return;
    }
    for ( var i = 0; i < cells.length; i++ ) {
      cells[i].wrapShift( 0 );
    }
  };

  // -------------------------- physics -------------------------- //

  proto.integratePhysics = function() {
    this.x += this.velocity;
    this.velocity *= this.getFrictionFactor();
  };

  proto.applyForce = function( force ) {
    this.velocity += force;
  };

  proto.getFrictionFactor = function() {
    return 1 - this.options[ this.isFreeScrolling ? 'freeScrollFriction' : 'friction' ];
  };

  proto.getRestingPosition = function() {
    // my thanks to Steven Wittens, who simplified this math greatly
    return this.x + this.velocity / ( 1 - this.getFrictionFactor() );
  };

  proto.applyDragForce = function() {
    if ( !this.isDraggable || !this.isPointerDown ) {
      return;
    }
    // change the position to drag position by applying force
    var dragVelocity = this.dragX - this.x;
    var dragForce = dragVelocity - this.velocity;
    this.applyForce( dragForce );
  };

  proto.applySelectedAttraction = function() {
    // do not attract if pointer down or no slides
    var dragDown = this.isDraggable && this.isPointerDown;
    if ( dragDown || this.isFreeScrolling || !this.slides.length ) {
      return;
    }
    var distance = this.selectedSlide.target * -1 - this.x;
    var force = distance * this.options.selectedAttraction;
    this.applyForce( force );
  };

  return proto;

  } ) );
  });

  var flickity = createCommonjsModule(function (module) {
  // Flickity main
  /* eslint-disable max-params */
  ( function( window, factory ) {
    // universal module definition
    if (  module.exports ) {
      // CommonJS
      module.exports = factory(
          window,
          evEmitter,
          getSize,
          utils,
          cell,
          slide,
          animate
      );
    } else {
      // browser global
      var _Flickity = window.Flickity;

      window.Flickity = factory(
          window,
          window.EvEmitter,
          window.getSize,
          window.fizzyUIUtils,
          _Flickity.Cell,
          _Flickity.Slide,
          _Flickity.animatePrototype
      );
    }

  }( window, function factory( window, EvEmitter, getSize,
      utils, Cell, Slide, animatePrototype ) {

  // vars
  var jQuery = window.jQuery;
  var getComputedStyle = window.getComputedStyle;
  var console = window.console;

  function moveElements( elems, toElem ) {
    elems = utils.makeArray( elems );
    while ( elems.length ) {
      toElem.appendChild( elems.shift() );
    }
  }

  // -------------------------- Flickity -------------------------- //

  // globally unique identifiers
  var GUID = 0;
  // internal store of all Flickity intances
  var instances = {};

  function Flickity( element, options ) {
    var queryElement = utils.getQueryElement( element );
    if ( !queryElement ) {
      if ( console ) {
        console.error( 'Bad element for Flickity: ' + ( queryElement || element ) );
      }
      return;
    }
    this.element = queryElement;
    // do not initialize twice on same element
    if ( this.element.flickityGUID ) {
      var instance = instances[ this.element.flickityGUID ];
      if ( instance ) instance.option( options );
      return instance;
    }

    // add jQuery
    if ( jQuery ) {
      this.$element = jQuery( this.element );
    }
    // options
    this.options = utils.extend( {}, this.constructor.defaults );
    this.option( options );

    // kick things off
    this._create();
  }

  Flickity.defaults = {
    accessibility: true,
    // adaptiveHeight: false,
    cellAlign: 'center',
    // cellSelector: undefined,
    // contain: false,
    freeScrollFriction: 0.075, // friction when free-scrolling
    friction: 0.28, // friction when selecting
    namespaceJQueryEvents: true,
    // initialIndex: 0,
    percentPosition: true,
    resize: true,
    selectedAttraction: 0.025,
    setGallerySize: true,
    // watchCSS: false,
    // wrapAround: false
  };

  // hash of methods triggered on _create()
  Flickity.createMethods = [];

  var proto = Flickity.prototype;
  // inherit EventEmitter
  utils.extend( proto, EvEmitter.prototype );

  proto._create = function() {
    // add id for Flickity.data
    var id = this.guid = ++GUID;
    this.element.flickityGUID = id; // expando
    instances[ id ] = this; // associate via id
    // initial properties
    this.selectedIndex = 0;
    // how many frames slider has been in same position
    this.restingFrames = 0;
    // initial physics properties
    this.x = 0;
    this.velocity = 0;
    this.originSide = this.options.rightToLeft ? 'right' : 'left';
    // create viewport & slider
    this.viewport = document.createElement('div');
    this.viewport.className = 'flickity-viewport';
    this._createSlider();

    if ( this.options.resize || this.options.watchCSS ) {
      window.addEventListener( 'resize', this );
    }

    // add listeners from on option
    for ( var eventName in this.options.on ) {
      var listener = this.options.on[ eventName ];
      this.on( eventName, listener );
    }

    Flickity.createMethods.forEach( function( method ) {
      this[ method ]();
    }, this );

    if ( this.options.watchCSS ) {
      this.watchCSS();
    } else {
      this.activate();
    }

  };

  /**
   * set options
   * @param {Object} opts - options to extend
   */
  proto.option = function( opts ) {
    utils.extend( this.options, opts );
  };

  proto.activate = function() {
    if ( this.isActive ) {
      return;
    }
    this.isActive = true;
    this.element.classList.add('flickity-enabled');
    if ( this.options.rightToLeft ) {
      this.element.classList.add('flickity-rtl');
    }

    this.getSize();
    // move initial cell elements so they can be loaded as cells
    var cellElems = this._filterFindCellElements( this.element.children );
    moveElements( cellElems, this.slider );
    this.viewport.appendChild( this.slider );
    this.element.appendChild( this.viewport );
    // get cells from children
    this.reloadCells();

    if ( this.options.accessibility ) {
      // allow element to focusable
      this.element.tabIndex = 0;
      // listen for key presses
      this.element.addEventListener( 'keydown', this );
    }

    this.emitEvent('activate');
    this.selectInitialIndex();
    // flag for initial activation, for using initialIndex
    this.isInitActivated = true;
    // ready event. #493
    this.dispatchEvent('ready');
  };

  // slider positions the cells
  proto._createSlider = function() {
    // slider element does all the positioning
    var slider = document.createElement('div');
    slider.className = 'flickity-slider';
    slider.style[ this.originSide ] = 0;
    this.slider = slider;
  };

  proto._filterFindCellElements = function( elems ) {
    return utils.filterFindElements( elems, this.options.cellSelector );
  };

  // goes through all children
  proto.reloadCells = function() {
    // collection of item elements
    this.cells = this._makeCells( this.slider.children );
    this.positionCells();
    this._getWrapShiftCells();
    this.setGallerySize();
  };

  /**
   * turn elements into Flickity.Cells
   * @param {[Array, NodeList, HTMLElement]} elems - elements to make into cells
   * @returns {Array} items - collection of new Flickity Cells
   */
  proto._makeCells = function( elems ) {
    var cellElems = this._filterFindCellElements( elems );

    // create new Flickity for collection
    var cells = cellElems.map( function( cellElem ) {
      return new Cell( cellElem, this );
    }, this );

    return cells;
  };

  proto.getLastCell = function() {
    return this.cells[ this.cells.length - 1 ];
  };

  proto.getLastSlide = function() {
    return this.slides[ this.slides.length - 1 ];
  };

  // positions all cells
  proto.positionCells = function() {
    // size all cells
    this._sizeCells( this.cells );
    // position all cells
    this._positionCells( 0 );
  };

  /**
   * position certain cells
   * @param {Integer} index - which cell to start with
   */
  proto._positionCells = function( index ) {
    index = index || 0;
    // also measure maxCellHeight
    // start 0 if positioning all cells
    this.maxCellHeight = index ? this.maxCellHeight || 0 : 0;
    var cellX = 0;
    // get cellX
    if ( index > 0 ) {
      var startCell = this.cells[ index - 1 ];
      cellX = startCell.x + startCell.size.outerWidth;
    }
    var len = this.cells.length;
    for ( var i = index; i < len; i++ ) {
      var cell = this.cells[i];
      cell.setPosition( cellX );
      cellX += cell.size.outerWidth;
      this.maxCellHeight = Math.max( cell.size.outerHeight, this.maxCellHeight );
    }
    // keep track of cellX for wrap-around
    this.slideableWidth = cellX;
    // slides
    this.updateSlides();
    // contain slides target
    this._containSlides();
    // update slidesWidth
    this.slidesWidth = len ? this.getLastSlide().target - this.slides[0].target : 0;
  };

  /**
   * cell.getSize() on multiple cells
   * @param {Array} cells - cells to size
   */
  proto._sizeCells = function( cells ) {
    cells.forEach( function( cell ) {
      cell.getSize();
    } );
  };

  // --------------------------  -------------------------- //

  proto.updateSlides = function() {
    this.slides = [];
    if ( !this.cells.length ) {
      return;
    }

    var slide = new Slide( this );
    this.slides.push( slide );
    var isOriginLeft = this.originSide == 'left';
    var nextMargin = isOriginLeft ? 'marginRight' : 'marginLeft';

    var canCellFit = this._getCanCellFit();

    this.cells.forEach( function( cell, i ) {
      // just add cell if first cell in slide
      if ( !slide.cells.length ) {
        slide.addCell( cell );
        return;
      }

      var slideWidth = ( slide.outerWidth - slide.firstMargin ) +
        ( cell.size.outerWidth - cell.size[ nextMargin ] );

      if ( canCellFit.call( this, i, slideWidth ) ) {
        slide.addCell( cell );
      } else {
        // doesn't fit, new slide
        slide.updateTarget();

        slide = new Slide( this );
        this.slides.push( slide );
        slide.addCell( cell );
      }
    }, this );
    // last slide
    slide.updateTarget();
    // update .selectedSlide
    this.updateSelectedSlide();
  };

  proto._getCanCellFit = function() {
    var groupCells = this.options.groupCells;
    if ( !groupCells ) {
      return function() {
        return false;
      };
    } else if ( typeof groupCells == 'number' ) {
      // group by number. 3 -> [0,1,2], [3,4,5], ...
      var number = parseInt( groupCells, 10 );
      return function( i ) {
        return ( i % number ) !== 0;
      };
    }
    // default, group by width of slide
    // parse '75%
    var percentMatch = typeof groupCells == 'string' &&
      groupCells.match( /^(\d+)%$/ );
    var percent = percentMatch ? parseInt( percentMatch[1], 10 ) / 100 : 1;
    return function( i, slideWidth ) {
      /* eslint-disable-next-line no-invalid-this */
      return slideWidth <= ( this.size.innerWidth + 1 ) * percent;
    };
  };

  // alias _init for jQuery plugin .flickity()
  proto._init =
  proto.reposition = function() {
    this.positionCells();
    this.positionSliderAtSelected();
  };

  proto.getSize = function() {
    this.size = getSize( this.element );
    this.setCellAlign();
    this.cursorPosition = this.size.innerWidth * this.cellAlign;
  };

  var cellAlignShorthands = {
    // cell align, then based on origin side
    center: {
      left: 0.5,
      right: 0.5,
    },
    left: {
      left: 0,
      right: 1,
    },
    right: {
      right: 0,
      left: 1,
    },
  };

  proto.setCellAlign = function() {
    var shorthand = cellAlignShorthands[ this.options.cellAlign ];
    this.cellAlign = shorthand ? shorthand[ this.originSide ] : this.options.cellAlign;
  };

  proto.setGallerySize = function() {
    if ( this.options.setGallerySize ) {
      var height = this.options.adaptiveHeight && this.selectedSlide ?
        this.selectedSlide.height : this.maxCellHeight;
      this.viewport.style.height = height + 'px';
    }
  };

  proto._getWrapShiftCells = function() {
    // only for wrap-around
    if ( !this.options.wrapAround ) {
      return;
    }
    // unshift previous cells
    this._unshiftCells( this.beforeShiftCells );
    this._unshiftCells( this.afterShiftCells );
    // get before cells
    // initial gap
    var gapX = this.cursorPosition;
    var cellIndex = this.cells.length - 1;
    this.beforeShiftCells = this._getGapCells( gapX, cellIndex, -1 );
    // get after cells
    // ending gap between last cell and end of gallery viewport
    gapX = this.size.innerWidth - this.cursorPosition;
    // start cloning at first cell, working forwards
    this.afterShiftCells = this._getGapCells( gapX, 0, 1 );
  };

  proto._getGapCells = function( gapX, cellIndex, increment ) {
    // keep adding cells until the cover the initial gap
    var cells = [];
    while ( gapX > 0 ) {
      var cell = this.cells[ cellIndex ];
      if ( !cell ) {
        break;
      }
      cells.push( cell );
      cellIndex += increment;
      gapX -= cell.size.outerWidth;
    }
    return cells;
  };

  // ----- contain ----- //

  // contain cell targets so no excess sliding
  proto._containSlides = function() {
    if ( !this.options.contain || this.options.wrapAround || !this.cells.length ) {
      return;
    }
    var isRightToLeft = this.options.rightToLeft;
    var beginMargin = isRightToLeft ? 'marginRight' : 'marginLeft';
    var endMargin = isRightToLeft ? 'marginLeft' : 'marginRight';
    var contentWidth = this.slideableWidth - this.getLastCell().size[ endMargin ];
    // content is less than gallery size
    var isContentSmaller = contentWidth < this.size.innerWidth;
    // bounds
    var beginBound = this.cursorPosition + this.cells[0].size[ beginMargin ];
    var endBound = contentWidth - this.size.innerWidth * ( 1 - this.cellAlign );
    // contain each cell target
    this.slides.forEach( function( slide ) {
      if ( isContentSmaller ) {
        // all cells fit inside gallery
        slide.target = contentWidth * this.cellAlign;
      } else {
        // contain to bounds
        slide.target = Math.max( slide.target, beginBound );
        slide.target = Math.min( slide.target, endBound );
      }
    }, this );
  };

  // -----  ----- //

  /**
   * emits events via eventEmitter and jQuery events
   * @param {String} type - name of event
   * @param {Event} event - original event
   * @param {Array} args - extra arguments
   */
  proto.dispatchEvent = function( type, event, args ) {
    var emitArgs = event ? [ event ].concat( args ) : args;
    this.emitEvent( type, emitArgs );

    if ( jQuery && this.$element ) {
      // default trigger with type if no event
      type += this.options.namespaceJQueryEvents ? '.flickity' : '';
      var $event = type;
      if ( event ) {
        // create jQuery event
        var jQEvent = new jQuery.Event( event );
        jQEvent.type = type;
        $event = jQEvent;
      }
      this.$element.trigger( $event, args );
    }
  };

  // -------------------------- select -------------------------- //

  /**
   * @param {Integer} index - index of the slide
   * @param {Boolean} isWrap - will wrap-around to last/first if at the end
   * @param {Boolean} isInstant - will immediately set position at selected cell
   */
  proto.select = function( index, isWrap, isInstant ) {
    if ( !this.isActive ) {
      return;
    }
    index = parseInt( index, 10 );
    this._wrapSelect( index );

    if ( this.options.wrapAround || isWrap ) {
      index = utils.modulo( index, this.slides.length );
    }
    // bail if invalid index
    if ( !this.slides[ index ] ) {
      return;
    }
    var prevIndex = this.selectedIndex;
    this.selectedIndex = index;
    this.updateSelectedSlide();
    if ( isInstant ) {
      this.positionSliderAtSelected();
    } else {
      this.startAnimation();
    }
    if ( this.options.adaptiveHeight ) {
      this.setGallerySize();
    }
    // events
    this.dispatchEvent( 'select', null, [ index ] );
    // change event if new index
    if ( index != prevIndex ) {
      this.dispatchEvent( 'change', null, [ index ] );
    }
    // old v1 event name, remove in v3
    this.dispatchEvent('cellSelect');
  };

  // wraps position for wrapAround, to move to closest slide. #113
  proto._wrapSelect = function( index ) {
    var len = this.slides.length;
    var isWrapping = this.options.wrapAround && len > 1;
    if ( !isWrapping ) {
      return index;
    }
    var wrapIndex = utils.modulo( index, len );
    // go to shortest
    var delta = Math.abs( wrapIndex - this.selectedIndex );
    var backWrapDelta = Math.abs( ( wrapIndex + len ) - this.selectedIndex );
    var forewardWrapDelta = Math.abs( ( wrapIndex - len ) - this.selectedIndex );
    if ( !this.isDragSelect && backWrapDelta < delta ) {
      index += len;
    } else if ( !this.isDragSelect && forewardWrapDelta < delta ) {
      index -= len;
    }
    // wrap position so slider is within normal area
    if ( index < 0 ) {
      this.x -= this.slideableWidth;
    } else if ( index >= len ) {
      this.x += this.slideableWidth;
    }
  };

  proto.previous = function( isWrap, isInstant ) {
    this.select( this.selectedIndex - 1, isWrap, isInstant );
  };

  proto.next = function( isWrap, isInstant ) {
    this.select( this.selectedIndex + 1, isWrap, isInstant );
  };

  proto.updateSelectedSlide = function() {
    var slide = this.slides[ this.selectedIndex ];
    // selectedIndex could be outside of slides, if triggered before resize()
    if ( !slide ) {
      return;
    }
    // unselect previous selected slide
    this.unselectSelectedSlide();
    // update new selected slide
    this.selectedSlide = slide;
    slide.select();
    this.selectedCells = slide.cells;
    this.selectedElements = slide.getCellElements();
    // HACK: selectedCell & selectedElement is first cell in slide, backwards compatibility
    // Remove in v3?
    this.selectedCell = slide.cells[0];
    this.selectedElement = this.selectedElements[0];
  };

  proto.unselectSelectedSlide = function() {
    if ( this.selectedSlide ) {
      this.selectedSlide.unselect();
    }
  };

  proto.selectInitialIndex = function() {
    var initialIndex = this.options.initialIndex;
    // already activated, select previous selectedIndex
    if ( this.isInitActivated ) {
      this.select( this.selectedIndex, false, true );
      return;
    }
    // select with selector string
    if ( initialIndex && typeof initialIndex == 'string' ) {
      var cell = this.queryCell( initialIndex );
      if ( cell ) {
        this.selectCell( initialIndex, false, true );
        return;
      }
    }

    var index = 0;
    // select with number
    if ( initialIndex && this.slides[ initialIndex ] ) {
      index = initialIndex;
    }
    // select instantly
    this.select( index, false, true );
  };

  /**
   * select slide from number or cell element
   * @param {[Element, Number]} value - zero-based index or element to select
   * @param {Boolean} isWrap - enables wrapping around for extra index
   * @param {Boolean} isInstant - disables slide animation
   */
  proto.selectCell = function( value, isWrap, isInstant ) {
    // get cell
    var cell = this.queryCell( value );
    if ( !cell ) {
      return;
    }

    var index = this.getCellSlideIndex( cell );
    this.select( index, isWrap, isInstant );
  };

  proto.getCellSlideIndex = function( cell ) {
    // get index of slides that has cell
    for ( var i = 0; i < this.slides.length; i++ ) {
      var slide = this.slides[i];
      var index = slide.cells.indexOf( cell );
      if ( index != -1 ) {
        return i;
      }
    }
  };

  // -------------------------- get cells -------------------------- //

  /**
   * get Flickity.Cell, given an Element
   * @param {Element} elem - matching cell element
   * @returns {Flickity.Cell} cell - matching cell
   */
  proto.getCell = function( elem ) {
    // loop through cells to get the one that matches
    for ( var i = 0; i < this.cells.length; i++ ) {
      var cell = this.cells[i];
      if ( cell.element == elem ) {
        return cell;
      }
    }
  };

  /**
   * get collection of Flickity.Cells, given Elements
   * @param {[Element, Array, NodeList]} elems - multiple elements
   * @returns {Array} cells - Flickity.Cells
   */
  proto.getCells = function( elems ) {
    elems = utils.makeArray( elems );
    var cells = [];
    elems.forEach( function( elem ) {
      var cell = this.getCell( elem );
      if ( cell ) {
        cells.push( cell );
      }
    }, this );
    return cells;
  };

  /**
   * get cell elements
   * @returns {Array} cellElems
   */
  proto.getCellElements = function() {
    return this.cells.map( function( cell ) {
      return cell.element;
    } );
  };

  /**
   * get parent cell from an element
   * @param {Element} elem - child element
   * @returns {Flickit.Cell} cell - parent cell
   */
  proto.getParentCell = function( elem ) {
    // first check if elem is cell
    var cell = this.getCell( elem );
    if ( cell ) {
      return cell;
    }
    // try to get parent cell elem
    elem = utils.getParent( elem, '.flickity-slider > *' );
    return this.getCell( elem );
  };

  /**
   * get cells adjacent to a slide
   * @param {Integer} adjCount - number of adjacent slides
   * @param {Integer} index - index of slide to start
   * @returns {Array} cells - array of Flickity.Cells
   */
  proto.getAdjacentCellElements = function( adjCount, index ) {
    if ( !adjCount ) {
      return this.selectedSlide.getCellElements();
    }
    index = index === undefined ? this.selectedIndex : index;

    var len = this.slides.length;
    if ( 1 + ( adjCount * 2 ) >= len ) {
      return this.getCellElements();
    }

    var cellElems = [];
    for ( var i = index - adjCount; i <= index + adjCount; i++ ) {
      var slideIndex = this.options.wrapAround ? utils.modulo( i, len ) : i;
      var slide = this.slides[ slideIndex ];
      if ( slide ) {
        cellElems = cellElems.concat( slide.getCellElements() );
      }
    }
    return cellElems;
  };

  /**
   * select slide from number or cell element
   * @param {[Element, String, Number]} selector - element, selector string, or index
   * @returns {Flickity.Cell} - matching cell
   */
  proto.queryCell = function( selector ) {
    if ( typeof selector == 'number' ) {
      // use number as index
      return this.cells[ selector ];
    }
    if ( typeof selector == 'string' ) {
      // do not select invalid selectors from hash: #123, #/. #791
      if ( selector.match( /^[#.]?[\d/]/ ) ) {
        return;
      }
      // use string as selector, get element
      selector = this.element.querySelector( selector );
    }
    // get cell from element
    return this.getCell( selector );
  };

  // -------------------------- events -------------------------- //

  proto.uiChange = function() {
    this.emitEvent('uiChange');
  };

  // keep focus on element when child UI elements are clicked
  proto.childUIPointerDown = function( event ) {
    // HACK iOS does not allow touch events to bubble up?!
    if ( event.type != 'touchstart' ) {
      event.preventDefault();
    }
    this.focus();
  };

  // ----- resize ----- //

  proto.onresize = function() {
    this.watchCSS();
    this.resize();
  };

  utils.debounceMethod( Flickity, 'onresize', 150 );

  proto.resize = function() {
    // #1177 disable resize behavior when animating or dragging for iOS 15
    if ( !this.isActive || this.isAnimating || this.isDragging ) {
      return;
    }
    this.getSize();
    // wrap values
    if ( this.options.wrapAround ) {
      this.x = utils.modulo( this.x, this.slideableWidth );
    }
    this.positionCells();
    this._getWrapShiftCells();
    this.setGallerySize();
    this.emitEvent('resize');
    // update selected index for group slides, instant
    // TODO: position can be lost between groups of various numbers
    var selectedElement = this.selectedElements && this.selectedElements[0];
    this.selectCell( selectedElement, false, true );
  };

  // watches the :after property, activates/deactivates
  proto.watchCSS = function() {
    var watchOption = this.options.watchCSS;
    if ( !watchOption ) {
      return;
    }

    var afterContent = getComputedStyle( this.element, ':after' ).content;
    // activate if :after { content: 'flickity' }
    if ( afterContent.indexOf('flickity') != -1 ) {
      this.activate();
    } else {
      this.deactivate();
    }
  };

  // ----- keydown ----- //

  // go previous/next if left/right keys pressed
  proto.onkeydown = function( event ) {
    // only work if element is in focus
    var isNotFocused = document.activeElement && document.activeElement != this.element;
    if ( !this.options.accessibility || isNotFocused ) {
      return;
    }

    var handler = Flickity.keyboardHandlers[ event.keyCode ];
    if ( handler ) {
      handler.call( this );
    }
  };

  Flickity.keyboardHandlers = {
    // left arrow
    37: function() {
      var leftMethod = this.options.rightToLeft ? 'next' : 'previous';
      this.uiChange();
      this[ leftMethod ]();
    },
    // right arrow
    39: function() {
      var rightMethod = this.options.rightToLeft ? 'previous' : 'next';
      this.uiChange();
      this[ rightMethod ]();
    },
  };

  // ----- focus ----- //

  proto.focus = function() {
    // TODO remove scrollTo once focus options gets more support
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus ...
    //    #Browser_compatibility
    var prevScrollY = window.pageYOffset;
    this.element.focus({ preventScroll: true });
    // hack to fix scroll jump after focus, #76
    if ( window.pageYOffset != prevScrollY ) {
      window.scrollTo( window.pageXOffset, prevScrollY );
    }
  };

  // -------------------------- destroy -------------------------- //

  // deactivate all Flickity functionality, but keep stuff available
  proto.deactivate = function() {
    if ( !this.isActive ) {
      return;
    }
    this.element.classList.remove('flickity-enabled');
    this.element.classList.remove('flickity-rtl');
    this.unselectSelectedSlide();
    // destroy cells
    this.cells.forEach( function( cell ) {
      cell.destroy();
    } );
    this.element.removeChild( this.viewport );
    // move child elements back into element
    moveElements( this.slider.children, this.element );
    if ( this.options.accessibility ) {
      this.element.removeAttribute('tabIndex');
      this.element.removeEventListener( 'keydown', this );
    }
    // set flags
    this.isActive = false;
    this.emitEvent('deactivate');
  };

  proto.destroy = function() {
    this.deactivate();
    window.removeEventListener( 'resize', this );
    this.allOff();
    this.emitEvent('destroy');
    if ( jQuery && this.$element ) {
      jQuery.removeData( this.element, 'flickity' );
    }
    delete this.element.flickityGUID;
    delete instances[ this.guid ];
  };

  // -------------------------- prototype -------------------------- //

  utils.extend( proto, animatePrototype );

  // -------------------------- extras -------------------------- //

  /**
   * get Flickity instance from element
   * @param {[Element, String]} elem - element or selector string
   * @returns {Flickity} - Flickity instance
   */
  Flickity.data = function( elem ) {
    elem = utils.getQueryElement( elem );
    var id = elem && elem.flickityGUID;
    return id && instances[ id ];
  };

  utils.htmlInit( Flickity, 'flickity' );

  if ( jQuery && jQuery.bridget ) {
    jQuery.bridget( 'flickity', Flickity );
  }

  // set internal jQuery, for Webpack + jQuery v3, #478
  Flickity.setJQuery = function( jq ) {
    jQuery = jq;
  };

  Flickity.Cell = Cell;
  Flickity.Slide = Slide;

  return Flickity;

  } ) );
  });

  /*!
   * Unipointer v2.4.0
   * base class for doing one thing with pointer event
   * MIT license
   */

  var unipointer = createCommonjsModule(function (module) {
  /*jshint browser: true, undef: true, unused: true, strict: true */

  ( function( window, factory ) {
    // universal module definition
    /* jshint strict: false */ /*global define, module, require */
    if (  module.exports ) {
      // CommonJS
      module.exports = factory(
        window,
        evEmitter
      );
    } else {
      // browser global
      window.Unipointer = factory(
        window,
        window.EvEmitter
      );
    }

  }( window, function factory( window, EvEmitter ) {

  function noop() {}

  function Unipointer() {}

  // inherit EvEmitter
  var proto = Unipointer.prototype = Object.create( EvEmitter.prototype );

  proto.bindStartEvent = function( elem ) {
    this._bindStartEvent( elem, true );
  };

  proto.unbindStartEvent = function( elem ) {
    this._bindStartEvent( elem, false );
  };

  /**
   * Add or remove start event
   * @param {Boolean} isAdd - remove if falsey
   */
  proto._bindStartEvent = function( elem, isAdd ) {
    // munge isAdd, default to true
    isAdd = isAdd === undefined ? true : isAdd;
    var bindMethod = isAdd ? 'addEventListener' : 'removeEventListener';

    // default to mouse events
    var startEvent = 'mousedown';
    if ( 'ontouchstart' in window ) {
      // HACK prefer Touch Events as you can preventDefault on touchstart to
      // disable scroll in iOS & mobile Chrome metafizzy/flickity#1177
      startEvent = 'touchstart';
    } else if ( window.PointerEvent ) {
      // Pointer Events
      startEvent = 'pointerdown';
    }
    elem[ bindMethod ]( startEvent, this );
  };

  // trigger handler methods for events
  proto.handleEvent = function( event ) {
    var method = 'on' + event.type;
    if ( this[ method ] ) {
      this[ method ]( event );
    }
  };

  // returns the touch that we're keeping track of
  proto.getTouch = function( touches ) {
    for ( var i=0; i < touches.length; i++ ) {
      var touch = touches[i];
      if ( touch.identifier == this.pointerIdentifier ) {
        return touch;
      }
    }
  };

  // ----- start event ----- //

  proto.onmousedown = function( event ) {
    // dismiss clicks from right or middle buttons
    var button = event.button;
    if ( button && ( button !== 0 && button !== 1 ) ) {
      return;
    }
    this._pointerDown( event, event );
  };

  proto.ontouchstart = function( event ) {
    this._pointerDown( event, event.changedTouches[0] );
  };

  proto.onpointerdown = function( event ) {
    this._pointerDown( event, event );
  };

  /**
   * pointer start
   * @param {Event} event
   * @param {Event or Touch} pointer
   */
  proto._pointerDown = function( event, pointer ) {
    // dismiss right click and other pointers
    // button = 0 is okay, 1-4 not
    if ( event.button || this.isPointerDown ) {
      return;
    }

    this.isPointerDown = true;
    // save pointer identifier to match up touch events
    this.pointerIdentifier = pointer.pointerId !== undefined ?
      // pointerId for pointer events, touch.indentifier for touch events
      pointer.pointerId : pointer.identifier;

    this.pointerDown( event, pointer );
  };

  proto.pointerDown = function( event, pointer ) {
    this._bindPostStartEvents( event );
    this.emitEvent( 'pointerDown', [ event, pointer ] );
  };

  // hash of events to be bound after start event
  var postStartEvents = {
    mousedown: [ 'mousemove', 'mouseup' ],
    touchstart: [ 'touchmove', 'touchend', 'touchcancel' ],
    pointerdown: [ 'pointermove', 'pointerup', 'pointercancel' ],
  };

  proto._bindPostStartEvents = function( event ) {
    if ( !event ) {
      return;
    }
    // get proper events to match start event
    var events = postStartEvents[ event.type ];
    // bind events to node
    events.forEach( function( eventName ) {
      window.addEventListener( eventName, this );
    }, this );
    // save these arguments
    this._boundPointerEvents = events;
  };

  proto._unbindPostStartEvents = function() {
    // check for _boundEvents, in case dragEnd triggered twice (old IE8 bug)
    if ( !this._boundPointerEvents ) {
      return;
    }
    this._boundPointerEvents.forEach( function( eventName ) {
      window.removeEventListener( eventName, this );
    }, this );

    delete this._boundPointerEvents;
  };

  // ----- move event ----- //

  proto.onmousemove = function( event ) {
    this._pointerMove( event, event );
  };

  proto.onpointermove = function( event ) {
    if ( event.pointerId == this.pointerIdentifier ) {
      this._pointerMove( event, event );
    }
  };

  proto.ontouchmove = function( event ) {
    var touch = this.getTouch( event.changedTouches );
    if ( touch ) {
      this._pointerMove( event, touch );
    }
  };

  /**
   * pointer move
   * @param {Event} event
   * @param {Event or Touch} pointer
   * @private
   */
  proto._pointerMove = function( event, pointer ) {
    this.pointerMove( event, pointer );
  };

  // public
  proto.pointerMove = function( event, pointer ) {
    this.emitEvent( 'pointerMove', [ event, pointer ] );
  };

  // ----- end event ----- //


  proto.onmouseup = function( event ) {
    this._pointerUp( event, event );
  };

  proto.onpointerup = function( event ) {
    if ( event.pointerId == this.pointerIdentifier ) {
      this._pointerUp( event, event );
    }
  };

  proto.ontouchend = function( event ) {
    var touch = this.getTouch( event.changedTouches );
    if ( touch ) {
      this._pointerUp( event, touch );
    }
  };

  /**
   * pointer up
   * @param {Event} event
   * @param {Event or Touch} pointer
   * @private
   */
  proto._pointerUp = function( event, pointer ) {
    this._pointerDone();
    this.pointerUp( event, pointer );
  };

  // public
  proto.pointerUp = function( event, pointer ) {
    this.emitEvent( 'pointerUp', [ event, pointer ] );
  };

  // ----- pointer done ----- //

  // triggered on pointer up & pointer cancel
  proto._pointerDone = function() {
    this._pointerReset();
    this._unbindPostStartEvents();
    this.pointerDone();
  };

  proto._pointerReset = function() {
    // reset properties
    this.isPointerDown = false;
    delete this.pointerIdentifier;
  };

  proto.pointerDone = noop;

  // ----- pointer cancel ----- //

  proto.onpointercancel = function( event ) {
    if ( event.pointerId == this.pointerIdentifier ) {
      this._pointerCancel( event, event );
    }
  };

  proto.ontouchcancel = function( event ) {
    var touch = this.getTouch( event.changedTouches );
    if ( touch ) {
      this._pointerCancel( event, touch );
    }
  };

  /**
   * pointer cancel
   * @param {Event} event
   * @param {Event or Touch} pointer
   * @private
   */
  proto._pointerCancel = function( event, pointer ) {
    this._pointerDone();
    this.pointerCancel( event, pointer );
  };

  // public
  proto.pointerCancel = function( event, pointer ) {
    this.emitEvent( 'pointerCancel', [ event, pointer ] );
  };

  // -----  ----- //

  // utility function for getting x/y coords from event
  Unipointer.getPointerPoint = function( pointer ) {
    return {
      x: pointer.pageX,
      y: pointer.pageY
    };
  };

  // -----  ----- //

  return Unipointer;

  }));
  });

  /*!
   * Unidragger v2.4.0
   * Draggable base class
   * MIT license
   */

  var unidragger = createCommonjsModule(function (module) {
  /*jshint browser: true, unused: true, undef: true, strict: true */

  ( function( window, factory ) {
    // universal module definition
    /*jshint strict: false */ /*globals define, module, require */

    if (  module.exports ) {
      // CommonJS
      module.exports = factory(
        window,
        unipointer
      );
    } else {
      // browser global
      window.Unidragger = factory(
        window,
        window.Unipointer
      );
    }

  }( window, function factory( window, Unipointer ) {

  // -------------------------- Unidragger -------------------------- //

  function Unidragger() {}

  // inherit Unipointer & EvEmitter
  var proto = Unidragger.prototype = Object.create( Unipointer.prototype );

  // ----- bind start ----- //

  proto.bindHandles = function() {
    this._bindHandles( true );
  };

  proto.unbindHandles = function() {
    this._bindHandles( false );
  };

  /**
   * Add or remove start event
   * @param {Boolean} isAdd
   */
  proto._bindHandles = function( isAdd ) {
    // munge isAdd, default to true
    isAdd = isAdd === undefined ? true : isAdd;
    // bind each handle
    var bindMethod = isAdd ? 'addEventListener' : 'removeEventListener';
    var touchAction = isAdd ? this._touchActionValue : '';
    for ( var i=0; i < this.handles.length; i++ ) {
      var handle = this.handles[i];
      this._bindStartEvent( handle, isAdd );
      handle[ bindMethod ]( 'click', this );
      // touch-action: none to override browser touch gestures. metafizzy/flickity#540
      if ( window.PointerEvent ) {
        handle.style.touchAction = touchAction;
      }
    }
  };

  // prototype so it can be overwriteable by Flickity
  proto._touchActionValue = 'none';

  // ----- start event ----- //

  /**
   * pointer start
   * @param {Event} event
   * @param {Event or Touch} pointer
   */
  proto.pointerDown = function( event, pointer ) {
    var isOkay = this.okayPointerDown( event );
    if ( !isOkay ) {
      return;
    }
    // track start event position
    // Safari 9 overrides pageX and pageY. These values needs to be copied. flickity#842
    this.pointerDownPointer = {
      pageX: pointer.pageX,
      pageY: pointer.pageY,
    };

    event.preventDefault();
    this.pointerDownBlur();
    // bind move and end events
    this._bindPostStartEvents( event );
    this.emitEvent( 'pointerDown', [ event, pointer ] );
  };

  // nodes that have text fields
  var cursorNodes = {
    TEXTAREA: true,
    INPUT: true,
    SELECT: true,
    OPTION: true,
  };

  // input types that do not have text fields
  var clickTypes = {
    radio: true,
    checkbox: true,
    button: true,
    submit: true,
    image: true,
    file: true,
  };

  // dismiss inputs with text fields. flickity#403, flickity#404
  proto.okayPointerDown = function( event ) {
    var isCursorNode = cursorNodes[ event.target.nodeName ];
    var isClickType = clickTypes[ event.target.type ];
    var isOkay = !isCursorNode || isClickType;
    if ( !isOkay ) {
      this._pointerReset();
    }
    return isOkay;
  };

  // kludge to blur previously focused input
  proto.pointerDownBlur = function() {
    var focused = document.activeElement;
    // do not blur body for IE10, metafizzy/flickity#117
    var canBlur = focused && focused.blur && focused != document.body;
    if ( canBlur ) {
      focused.blur();
    }
  };

  // ----- move event ----- //

  /**
   * drag move
   * @param {Event} event
   * @param {Event or Touch} pointer
   */
  proto.pointerMove = function( event, pointer ) {
    var moveVector = this._dragPointerMove( event, pointer );
    this.emitEvent( 'pointerMove', [ event, pointer, moveVector ] );
    this._dragMove( event, pointer, moveVector );
  };

  // base pointer move logic
  proto._dragPointerMove = function( event, pointer ) {
    var moveVector = {
      x: pointer.pageX - this.pointerDownPointer.pageX,
      y: pointer.pageY - this.pointerDownPointer.pageY
    };
    // start drag if pointer has moved far enough to start drag
    if ( !this.isDragging && this.hasDragStarted( moveVector ) ) {
      this._dragStart( event, pointer );
    }
    return moveVector;
  };

  // condition if pointer has moved far enough to start drag
  proto.hasDragStarted = function( moveVector ) {
    return Math.abs( moveVector.x ) > 3 || Math.abs( moveVector.y ) > 3;
  };

  // ----- end event ----- //

  /**
   * pointer up
   * @param {Event} event
   * @param {Event or Touch} pointer
   */
  proto.pointerUp = function( event, pointer ) {
    this.emitEvent( 'pointerUp', [ event, pointer ] );
    this._dragPointerUp( event, pointer );
  };

  proto._dragPointerUp = function( event, pointer ) {
    if ( this.isDragging ) {
      this._dragEnd( event, pointer );
    } else {
      // pointer didn't move enough for drag to start
      this._staticClick( event, pointer );
    }
  };

  // -------------------------- drag -------------------------- //

  // dragStart
  proto._dragStart = function( event, pointer ) {
    this.isDragging = true;
    // prevent clicks
    this.isPreventingClicks = true;
    this.dragStart( event, pointer );
  };

  proto.dragStart = function( event, pointer ) {
    this.emitEvent( 'dragStart', [ event, pointer ] );
  };

  // dragMove
  proto._dragMove = function( event, pointer, moveVector ) {
    // do not drag if not dragging yet
    if ( !this.isDragging ) {
      return;
    }

    this.dragMove( event, pointer, moveVector );
  };

  proto.dragMove = function( event, pointer, moveVector ) {
    event.preventDefault();
    this.emitEvent( 'dragMove', [ event, pointer, moveVector ] );
  };

  // dragEnd
  proto._dragEnd = function( event, pointer ) {
    // set flags
    this.isDragging = false;
    // re-enable clicking async
    setTimeout( function() {
      delete this.isPreventingClicks;
    }.bind( this ) );

    this.dragEnd( event, pointer );
  };

  proto.dragEnd = function( event, pointer ) {
    this.emitEvent( 'dragEnd', [ event, pointer ] );
  };

  // ----- onclick ----- //

  // handle all clicks and prevent clicks when dragging
  proto.onclick = function( event ) {
    if ( this.isPreventingClicks ) {
      event.preventDefault();
    }
  };

  // ----- staticClick ----- //

  // triggered after pointer down & up with no/tiny movement
  proto._staticClick = function( event, pointer ) {
    // ignore emulated mouse up clicks
    if ( this.isIgnoringMouseUp && event.type == 'mouseup' ) {
      return;
    }

    this.staticClick( event, pointer );

    // set flag for emulated clicks 300ms after touchend
    if ( event.type != 'mouseup' ) {
      this.isIgnoringMouseUp = true;
      // reset flag after 300ms
      setTimeout( function() {
        delete this.isIgnoringMouseUp;
      }.bind( this ), 400 );
    }
  };

  proto.staticClick = function( event, pointer ) {
    this.emitEvent( 'staticClick', [ event, pointer ] );
  };

  // ----- utils ----- //

  Unidragger.getPointerPoint = Unipointer.getPointerPoint;

  // -----  ----- //

  return Unidragger;

  }));
  });

  var drag = createCommonjsModule(function (module) {
  // drag
  ( function( window, factory ) {
    // universal module definition
    if (  module.exports ) {
      // CommonJS
      module.exports = factory(
          window,
          flickity,
          unidragger,
          utils
      );
    } else {
      // browser global
      window.Flickity = factory(
          window,
          window.Flickity,
          window.Unidragger,
          window.fizzyUIUtils
      );
    }

  }( window, function factory( window, Flickity, Unidragger, utils ) {

  // ----- defaults ----- //

  utils.extend( Flickity.defaults, {
    draggable: '>1',
    dragThreshold: 3,
  } );

  // ----- create ----- //

  Flickity.createMethods.push('_createDrag');

  // -------------------------- drag prototype -------------------------- //

  var proto = Flickity.prototype;
  utils.extend( proto, Unidragger.prototype );
  proto._touchActionValue = 'pan-y';

  // --------------------------  -------------------------- //

  proto._createDrag = function() {
    this.on( 'activate', this.onActivateDrag );
    this.on( 'uiChange', this._uiChangeDrag );
    this.on( 'deactivate', this.onDeactivateDrag );
    this.on( 'cellChange', this.updateDraggable );
    // TODO updateDraggable on resize? if groupCells & slides change
  };

  proto.onActivateDrag = function() {
    this.handles = [ this.viewport ];
    this.bindHandles();
    this.updateDraggable();
  };

  proto.onDeactivateDrag = function() {
    this.unbindHandles();
    this.element.classList.remove('is-draggable');
  };

  proto.updateDraggable = function() {
    // disable dragging if less than 2 slides. #278
    if ( this.options.draggable == '>1' ) {
      this.isDraggable = this.slides.length > 1;
    } else {
      this.isDraggable = this.options.draggable;
    }
    if ( this.isDraggable ) {
      this.element.classList.add('is-draggable');
    } else {
      this.element.classList.remove('is-draggable');
    }
  };

  // backwards compatibility
  proto.bindDrag = function() {
    this.options.draggable = true;
    this.updateDraggable();
  };

  proto.unbindDrag = function() {
    this.options.draggable = false;
    this.updateDraggable();
  };

  proto._uiChangeDrag = function() {
    delete this.isFreeScrolling;
  };

  // -------------------------- pointer events -------------------------- //

  proto.pointerDown = function( event, pointer ) {
    if ( !this.isDraggable ) {
      this._pointerDownDefault( event, pointer );
      return;
    }
    var isOkay = this.okayPointerDown( event );
    if ( !isOkay ) {
      return;
    }

    this._pointerDownPreventDefault( event );
    this.pointerDownFocus( event );
    // blur
    if ( document.activeElement != this.element ) {
      // do not blur if already focused
      this.pointerDownBlur();
    }

    // stop if it was moving
    this.dragX = this.x;
    this.viewport.classList.add('is-pointer-down');
    // track scrolling
    this.pointerDownScroll = getScrollPosition();
    window.addEventListener( 'scroll', this );

    this._pointerDownDefault( event, pointer );
  };

  // default pointerDown logic, used for staticClick
  proto._pointerDownDefault = function( event, pointer ) {
    // track start event position
    // Safari 9 overrides pageX and pageY. These values needs to be copied. #779
    this.pointerDownPointer = {
      pageX: pointer.pageX,
      pageY: pointer.pageY,
    };
    // bind move and end events
    this._bindPostStartEvents( event );
    this.dispatchEvent( 'pointerDown', event, [ pointer ] );
  };

  var focusNodes = {
    INPUT: true,
    TEXTAREA: true,
    SELECT: true,
  };

  proto.pointerDownFocus = function( event ) {
    var isFocusNode = focusNodes[ event.target.nodeName ];
    if ( !isFocusNode ) {
      this.focus();
    }
  };

  proto._pointerDownPreventDefault = function( event ) {
    var isTouchStart = event.type == 'touchstart';
    var isTouchPointer = event.pointerType == 'touch';
    var isFocusNode = focusNodes[ event.target.nodeName ];
    if ( !isTouchStart && !isTouchPointer && !isFocusNode ) {
      event.preventDefault();
    }
  };

  // ----- move ----- //

  proto.hasDragStarted = function( moveVector ) {
    return Math.abs( moveVector.x ) > this.options.dragThreshold;
  };

  // ----- up ----- //

  proto.pointerUp = function( event, pointer ) {
    delete this.isTouchScrolling;
    this.viewport.classList.remove('is-pointer-down');
    this.dispatchEvent( 'pointerUp', event, [ pointer ] );
    this._dragPointerUp( event, pointer );
  };

  proto.pointerDone = function() {
    window.removeEventListener( 'scroll', this );
    delete this.pointerDownScroll;
  };

  // -------------------------- dragging -------------------------- //

  proto.dragStart = function( event, pointer ) {
    if ( !this.isDraggable ) {
      return;
    }
    this.dragStartPosition = this.x;
    this.startAnimation();
    window.removeEventListener( 'scroll', this );
    this.dispatchEvent( 'dragStart', event, [ pointer ] );
  };

  proto.pointerMove = function( event, pointer ) {
    var moveVector = this._dragPointerMove( event, pointer );
    this.dispatchEvent( 'pointerMove', event, [ pointer, moveVector ] );
    this._dragMove( event, pointer, moveVector );
  };

  proto.dragMove = function( event, pointer, moveVector ) {
    if ( !this.isDraggable ) {
      return;
    }
    event.preventDefault();

    this.previousDragX = this.dragX;
    // reverse if right-to-left
    var direction = this.options.rightToLeft ? -1 : 1;
    if ( this.options.wrapAround ) {
      // wrap around move. #589
      moveVector.x %= this.slideableWidth;
    }
    var dragX = this.dragStartPosition + moveVector.x * direction;

    if ( !this.options.wrapAround && this.slides.length ) {
      // slow drag
      var originBound = Math.max( -this.slides[0].target, this.dragStartPosition );
      dragX = dragX > originBound ? ( dragX + originBound ) * 0.5 : dragX;
      var endBound = Math.min( -this.getLastSlide().target, this.dragStartPosition );
      dragX = dragX < endBound ? ( dragX + endBound ) * 0.5 : dragX;
    }

    this.dragX = dragX;

    this.dragMoveTime = new Date();
    this.dispatchEvent( 'dragMove', event, [ pointer, moveVector ] );
  };

  proto.dragEnd = function( event, pointer ) {
    if ( !this.isDraggable ) {
      return;
    }
    if ( this.options.freeScroll ) {
      this.isFreeScrolling = true;
    }
    // set selectedIndex based on where flick will end up
    var index = this.dragEndRestingSelect();

    if ( this.options.freeScroll && !this.options.wrapAround ) {
      // if free-scroll & not wrap around
      // do not free-scroll if going outside of bounding slides
      // so bounding slides can attract slider, and keep it in bounds
      var restingX = this.getRestingPosition();
      this.isFreeScrolling = -restingX > this.slides[0].target &&
        -restingX < this.getLastSlide().target;
    } else if ( !this.options.freeScroll && index == this.selectedIndex ) {
      // boost selection if selected index has not changed
      index += this.dragEndBoostSelect();
    }
    delete this.previousDragX;
    // apply selection
    // TODO refactor this, selecting here feels weird
    // HACK, set flag so dragging stays in correct direction
    this.isDragSelect = this.options.wrapAround;
    this.select( index );
    delete this.isDragSelect;
    this.dispatchEvent( 'dragEnd', event, [ pointer ] );
  };

  proto.dragEndRestingSelect = function() {
    var restingX = this.getRestingPosition();
    // how far away from selected slide
    var distance = Math.abs( this.getSlideDistance( -restingX, this.selectedIndex ) );
    // get closet resting going up and going down
    var positiveResting = this._getClosestResting( restingX, distance, 1 );
    var negativeResting = this._getClosestResting( restingX, distance, -1 );
    // use closer resting for wrap-around
    var index = positiveResting.distance < negativeResting.distance ?
      positiveResting.index : negativeResting.index;
    return index;
  };

  /**
   * given resting X and distance to selected cell
   * get the distance and index of the closest cell
   * @param {Number} restingX - estimated post-flick resting position
   * @param {Number} distance - distance to selected cell
   * @param {Integer} increment - +1 or -1, going up or down
   * @returns {Object} - { distance: {Number}, index: {Integer} }
   */
  proto._getClosestResting = function( restingX, distance, increment ) {
    var index = this.selectedIndex;
    var minDistance = Infinity;
    var condition = this.options.contain && !this.options.wrapAround ?
      // if contain, keep going if distance is equal to minDistance
      function( dist, minDist ) {
        return dist <= minDist;
      } : function( dist, minDist ) {
        return dist < minDist;
      };
    while ( condition( distance, minDistance ) ) {
      // measure distance to next cell
      index += increment;
      minDistance = distance;
      distance = this.getSlideDistance( -restingX, index );
      if ( distance === null ) {
        break;
      }
      distance = Math.abs( distance );
    }
    return {
      distance: minDistance,
      // selected was previous index
      index: index - increment,
    };
  };

  /**
   * measure distance between x and a slide target
   * @param {Number} x - horizontal position
   * @param {Integer} index - slide index
   * @returns {Number} - slide distance
   */
  proto.getSlideDistance = function( x, index ) {
    var len = this.slides.length;
    // wrap around if at least 2 slides
    var isWrapAround = this.options.wrapAround && len > 1;
    var slideIndex = isWrapAround ? utils.modulo( index, len ) : index;
    var slide = this.slides[ slideIndex ];
    if ( !slide ) {
      return null;
    }
    // add distance for wrap-around slides
    var wrap = isWrapAround ? this.slideableWidth * Math.floor( index/len ) : 0;
    return x - ( slide.target + wrap );
  };

  proto.dragEndBoostSelect = function() {
    // do not boost if no previousDragX or dragMoveTime
    if ( this.previousDragX === undefined || !this.dragMoveTime ||
      // or if drag was held for 100 ms
      new Date() - this.dragMoveTime > 100 ) {
      return 0;
    }

    var distance = this.getSlideDistance( -this.dragX, this.selectedIndex );
    var delta = this.previousDragX - this.dragX;
    if ( distance > 0 && delta > 0 ) {
      // boost to next if moving towards the right, and positive velocity
      return 1;
    } else if ( distance < 0 && delta < 0 ) {
      // boost to previous if moving towards the left, and negative velocity
      return -1;
    }
    return 0;
  };

  // ----- staticClick ----- //

  proto.staticClick = function( event, pointer ) {
    // get clickedCell, if cell was clicked
    var clickedCell = this.getParentCell( event.target );
    var cellElem = clickedCell && clickedCell.element;
    var cellIndex = clickedCell && this.cells.indexOf( clickedCell );
    this.dispatchEvent( 'staticClick', event, [ pointer, cellElem, cellIndex ] );
  };

  // ----- scroll ----- //

  proto.onscroll = function() {
    var scroll = getScrollPosition();
    var scrollMoveX = this.pointerDownScroll.x - scroll.x;
    var scrollMoveY = this.pointerDownScroll.y - scroll.y;
    // cancel click/tap if scroll is too much
    if ( Math.abs( scrollMoveX ) > 3 || Math.abs( scrollMoveY ) > 3 ) {
      this._pointerDone();
    }
  };

  // ----- utils ----- //

  function getScrollPosition() {
    return {
      x: window.pageXOffset,
      y: window.pageYOffset,
    };
  }

  // -----  ----- //

  return Flickity;

  } ) );
  });

  var prevNextButton = createCommonjsModule(function (module) {
  // prev/next buttons
  ( function( window, factory ) {
    // universal module definition
    if (  module.exports ) {
      // CommonJS
      module.exports = factory(
          window,
          flickity,
          unipointer,
          utils
      );
    } else {
      // browser global
      factory(
          window,
          window.Flickity,
          window.Unipointer,
          window.fizzyUIUtils
      );
    }

  }( window, function factory( window, Flickity, Unipointer, utils ) {

  var svgURI = 'http://www.w3.org/2000/svg';

  // -------------------------- PrevNextButton -------------------------- //

  function PrevNextButton( direction, parent ) {
    this.direction = direction;
    this.parent = parent;
    this._create();
  }

  PrevNextButton.prototype = Object.create( Unipointer.prototype );

  PrevNextButton.prototype._create = function() {
    // properties
    this.isEnabled = true;
    this.isPrevious = this.direction == -1;
    var leftDirection = this.parent.options.rightToLeft ? 1 : -1;
    this.isLeft = this.direction == leftDirection;

    var element = this.element = document.createElement('button');
    element.className = 'flickity-button flickity-prev-next-button';
    element.className += this.isPrevious ? ' previous' : ' next';
    // prevent button from submitting form http://stackoverflow.com/a/10836076/182183
    element.setAttribute( 'type', 'button' );
    // init as disabled
    this.disable();

    element.setAttribute( 'aria-label', this.isPrevious ? 'Previous' : 'Next' );

    // create arrow
    var svg = this.createSVG();
    element.appendChild( svg );
    // events
    this.parent.on( 'select', this.update.bind( this ) );
    this.on( 'pointerDown', this.parent.childUIPointerDown.bind( this.parent ) );
  };

  PrevNextButton.prototype.activate = function() {
    this.bindStartEvent( this.element );
    this.element.addEventListener( 'click', this );
    // add to DOM
    this.parent.element.appendChild( this.element );
  };

  PrevNextButton.prototype.deactivate = function() {
    // remove from DOM
    this.parent.element.removeChild( this.element );
    // click events
    this.unbindStartEvent( this.element );
    this.element.removeEventListener( 'click', this );
  };

  PrevNextButton.prototype.createSVG = function() {
    var svg = document.createElementNS( svgURI, 'svg' );
    svg.setAttribute( 'class', 'flickity-button-icon' );
    svg.setAttribute( 'viewBox', '0 0 100 100' );
    var path = document.createElementNS( svgURI, 'path' );
    var pathMovements = getArrowMovements( this.parent.options.arrowShape );
    path.setAttribute( 'd', pathMovements );
    path.setAttribute( 'class', 'arrow' );
    // rotate arrow
    if ( !this.isLeft ) {
      path.setAttribute( 'transform', 'translate(100, 100) rotate(180) ' );
    }
    svg.appendChild( path );
    return svg;
  };

  // get SVG path movmement
  function getArrowMovements( shape ) {
    // use shape as movement if string
    if ( typeof shape == 'string' ) {
      return shape;
    }
    // create movement string
    return 'M ' + shape.x0 + ',50' +
      ' L ' + shape.x1 + ',' + ( shape.y1 + 50 ) +
      ' L ' + shape.x2 + ',' + ( shape.y2 + 50 ) +
      ' L ' + shape.x3 + ',50 ' +
      ' L ' + shape.x2 + ',' + ( 50 - shape.y2 ) +
      ' L ' + shape.x1 + ',' + ( 50 - shape.y1 ) +
      ' Z';
  }

  PrevNextButton.prototype.handleEvent = utils.handleEvent;

  PrevNextButton.prototype.onclick = function() {
    if ( !this.isEnabled ) {
      return;
    }
    this.parent.uiChange();
    var method = this.isPrevious ? 'previous' : 'next';
    this.parent[ method ]();
  };

  // -----  ----- //

  PrevNextButton.prototype.enable = function() {
    if ( this.isEnabled ) {
      return;
    }
    this.element.disabled = false;
    this.isEnabled = true;
  };

  PrevNextButton.prototype.disable = function() {
    if ( !this.isEnabled ) {
      return;
    }
    this.element.disabled = true;
    this.isEnabled = false;
  };

  PrevNextButton.prototype.update = function() {
    // index of first or last slide, if previous or next
    var slides = this.parent.slides;
    // enable is wrapAround and at least 2 slides
    if ( this.parent.options.wrapAround && slides.length > 1 ) {
      this.enable();
      return;
    }
    var lastIndex = slides.length ? slides.length - 1 : 0;
    var boundIndex = this.isPrevious ? 0 : lastIndex;
    var method = this.parent.selectedIndex == boundIndex ? 'disable' : 'enable';
    this[ method ]();
  };

  PrevNextButton.prototype.destroy = function() {
    this.deactivate();
    this.allOff();
  };

  // -------------------------- Flickity prototype -------------------------- //

  utils.extend( Flickity.defaults, {
    prevNextButtons: true,
    arrowShape: {
      x0: 10,
      x1: 60, y1: 50,
      x2: 70, y2: 40,
      x3: 30,
    },
  } );

  Flickity.createMethods.push('_createPrevNextButtons');
  var proto = Flickity.prototype;

  proto._createPrevNextButtons = function() {
    if ( !this.options.prevNextButtons ) {
      return;
    }

    this.prevButton = new PrevNextButton( -1, this );
    this.nextButton = new PrevNextButton( 1, this );

    this.on( 'activate', this.activatePrevNextButtons );
  };

  proto.activatePrevNextButtons = function() {
    this.prevButton.activate();
    this.nextButton.activate();
    this.on( 'deactivate', this.deactivatePrevNextButtons );
  };

  proto.deactivatePrevNextButtons = function() {
    this.prevButton.deactivate();
    this.nextButton.deactivate();
    this.off( 'deactivate', this.deactivatePrevNextButtons );
  };

  // --------------------------  -------------------------- //

  Flickity.PrevNextButton = PrevNextButton;

  return Flickity;

  } ) );
  });

  var pageDots = createCommonjsModule(function (module) {
  // page dots
  ( function( window, factory ) {
    // universal module definition
    if (  module.exports ) {
      // CommonJS
      module.exports = factory(
          window,
          flickity,
          unipointer,
          utils
      );
    } else {
      // browser global
      factory(
          window,
          window.Flickity,
          window.Unipointer,
          window.fizzyUIUtils
      );
    }

  }( window, function factory( window, Flickity, Unipointer, utils ) {

  function PageDots( parent ) {
    this.parent = parent;
    this._create();
  }

  PageDots.prototype = Object.create( Unipointer.prototype );

  PageDots.prototype._create = function() {
    // create holder element
    this.holder = document.createElement('ol');
    this.holder.className = 'flickity-page-dots';
    // create dots, array of elements
    this.dots = [];
    // events
    this.handleClick = this.onClick.bind( this );
    this.on( 'pointerDown', this.parent.childUIPointerDown.bind( this.parent ) );
  };

  PageDots.prototype.activate = function() {
    this.setDots();
    this.holder.addEventListener( 'click', this.handleClick );
    this.bindStartEvent( this.holder );
    // add to DOM
    this.parent.element.appendChild( this.holder );
  };

  PageDots.prototype.deactivate = function() {
    this.holder.removeEventListener( 'click', this.handleClick );
    this.unbindStartEvent( this.holder );
    // remove from DOM
    this.parent.element.removeChild( this.holder );
  };

  PageDots.prototype.setDots = function() {
    // get difference between number of slides and number of dots
    var delta = this.parent.slides.length - this.dots.length;
    if ( delta > 0 ) {
      this.addDots( delta );
    } else if ( delta < 0 ) {
      this.removeDots( -delta );
    }
  };

  PageDots.prototype.addDots = function( count ) {
    var fragment = document.createDocumentFragment();
    var newDots = [];
    var length = this.dots.length;
    var max = length + count;

    for ( var i = length; i < max; i++ ) {
      var dot = document.createElement('li');
      dot.className = 'dot';
      dot.setAttribute( 'aria-label', 'Page dot ' + ( i + 1 ) );
      fragment.appendChild( dot );
      newDots.push( dot );
    }

    this.holder.appendChild( fragment );
    this.dots = this.dots.concat( newDots );
  };

  PageDots.prototype.removeDots = function( count ) {
    // remove from this.dots collection
    var removeDots = this.dots.splice( this.dots.length - count, count );
    // remove from DOM
    removeDots.forEach( function( dot ) {
      this.holder.removeChild( dot );
    }, this );
  };

  PageDots.prototype.updateSelected = function() {
    // remove selected class on previous
    if ( this.selectedDot ) {
      this.selectedDot.className = 'dot';
      this.selectedDot.removeAttribute('aria-current');
    }
    // don't proceed if no dots
    if ( !this.dots.length ) {
      return;
    }
    this.selectedDot = this.dots[ this.parent.selectedIndex ];
    this.selectedDot.className = 'dot is-selected';
    this.selectedDot.setAttribute( 'aria-current', 'step' );
  };

  PageDots.prototype.onTap = // old method name, backwards-compatible
  PageDots.prototype.onClick = function( event ) {
    var target = event.target;
    // only care about dot clicks
    if ( target.nodeName != 'LI' ) {
      return;
    }

    this.parent.uiChange();
    var index = this.dots.indexOf( target );
    this.parent.select( index );
  };

  PageDots.prototype.destroy = function() {
    this.deactivate();
    this.allOff();
  };

  Flickity.PageDots = PageDots;

  // -------------------------- Flickity -------------------------- //

  utils.extend( Flickity.defaults, {
    pageDots: true,
  } );

  Flickity.createMethods.push('_createPageDots');

  var proto = Flickity.prototype;

  proto._createPageDots = function() {
    if ( !this.options.pageDots ) {
      return;
    }
    this.pageDots = new PageDots( this );
    // events
    this.on( 'activate', this.activatePageDots );
    this.on( 'select', this.updateSelectedPageDots );
    this.on( 'cellChange', this.updatePageDots );
    this.on( 'resize', this.updatePageDots );
    this.on( 'deactivate', this.deactivatePageDots );
  };

  proto.activatePageDots = function() {
    this.pageDots.activate();
  };

  proto.updateSelectedPageDots = function() {
    this.pageDots.updateSelected();
  };

  proto.updatePageDots = function() {
    this.pageDots.setDots();
  };

  proto.deactivatePageDots = function() {
    this.pageDots.deactivate();
  };

  // -----  ----- //

  Flickity.PageDots = PageDots;

  return Flickity;

  } ) );
  });

  var player = createCommonjsModule(function (module) {
  // player & autoPlay
  ( function( window, factory ) {
    // universal module definition
    if (  module.exports ) {
      // CommonJS
      module.exports = factory(
          evEmitter,
          utils,
          flickity
      );
    } else {
      // browser global
      factory(
          window.EvEmitter,
          window.fizzyUIUtils,
          window.Flickity
      );
    }

  }( window, function factory( EvEmitter, utils, Flickity ) {

  // -------------------------- Player -------------------------- //

  function Player( parent ) {
    this.parent = parent;
    this.state = 'stopped';
    // visibility change event handler
    this.onVisibilityChange = this.visibilityChange.bind( this );
    this.onVisibilityPlay = this.visibilityPlay.bind( this );
  }

  Player.prototype = Object.create( EvEmitter.prototype );

  // start play
  Player.prototype.play = function() {
    if ( this.state == 'playing' ) {
      return;
    }
    // do not play if page is hidden, start playing when page is visible
    var isPageHidden = document.hidden;
    if ( isPageHidden ) {
      document.addEventListener( 'visibilitychange', this.onVisibilityPlay );
      return;
    }

    this.state = 'playing';
    // listen to visibility change
    document.addEventListener( 'visibilitychange', this.onVisibilityChange );
    // start ticking
    this.tick();
  };

  Player.prototype.tick = function() {
    // do not tick if not playing
    if ( this.state != 'playing' ) {
      return;
    }

    var time = this.parent.options.autoPlay;
    // default to 3 seconds
    time = typeof time == 'number' ? time : 3000;
    var _this = this;
    // HACK: reset ticks if stopped and started within interval
    this.clear();
    this.timeout = setTimeout( function() {
      _this.parent.next( true );
      _this.tick();
    }, time );
  };

  Player.prototype.stop = function() {
    this.state = 'stopped';
    this.clear();
    // remove visibility change event
    document.removeEventListener( 'visibilitychange', this.onVisibilityChange );
  };

  Player.prototype.clear = function() {
    clearTimeout( this.timeout );
  };

  Player.prototype.pause = function() {
    if ( this.state == 'playing' ) {
      this.state = 'paused';
      this.clear();
    }
  };

  Player.prototype.unpause = function() {
    // re-start play if paused
    if ( this.state == 'paused' ) {
      this.play();
    }
  };

  // pause if page visibility is hidden, unpause if visible
  Player.prototype.visibilityChange = function() {
    var isPageHidden = document.hidden;
    this[ isPageHidden ? 'pause' : 'unpause' ]();
  };

  Player.prototype.visibilityPlay = function() {
    this.play();
    document.removeEventListener( 'visibilitychange', this.onVisibilityPlay );
  };

  // -------------------------- Flickity -------------------------- //

  utils.extend( Flickity.defaults, {
    pauseAutoPlayOnHover: true,
  } );

  Flickity.createMethods.push('_createPlayer');
  var proto = Flickity.prototype;

  proto._createPlayer = function() {
    this.player = new Player( this );

    this.on( 'activate', this.activatePlayer );
    this.on( 'uiChange', this.stopPlayer );
    this.on( 'pointerDown', this.stopPlayer );
    this.on( 'deactivate', this.deactivatePlayer );
  };

  proto.activatePlayer = function() {
    if ( !this.options.autoPlay ) {
      return;
    }
    this.player.play();
    this.element.addEventListener( 'mouseenter', this );
  };

  // Player API, don't hate the ... thanks I know where the door is

  proto.playPlayer = function() {
    this.player.play();
  };

  proto.stopPlayer = function() {
    this.player.stop();
  };

  proto.pausePlayer = function() {
    this.player.pause();
  };

  proto.unpausePlayer = function() {
    this.player.unpause();
  };

  proto.deactivatePlayer = function() {
    this.player.stop();
    this.element.removeEventListener( 'mouseenter', this );
  };

  // ----- mouseenter/leave ----- //

  // pause auto-play on hover
  proto.onmouseenter = function() {
    if ( !this.options.pauseAutoPlayOnHover ) {
      return;
    }
    this.player.pause();
    this.element.addEventListener( 'mouseleave', this );
  };

  // resume auto-play on hover off
  proto.onmouseleave = function() {
    this.player.unpause();
    this.element.removeEventListener( 'mouseleave', this );
  };

  // -----  ----- //

  Flickity.Player = Player;

  return Flickity;

  } ) );
  });

  var addRemoveCell = createCommonjsModule(function (module) {
  // add, remove cell
  ( function( window, factory ) {
    // universal module definition
    if (  module.exports ) {
      // CommonJS
      module.exports = factory(
          window,
          flickity,
          utils
      );
    } else {
      // browser global
      factory(
          window,
          window.Flickity,
          window.fizzyUIUtils
      );
    }

  }( window, function factory( window, Flickity, utils ) {

  // append cells to a document fragment
  function getCellsFragment( cells ) {
    var fragment = document.createDocumentFragment();
    cells.forEach( function( cell ) {
      fragment.appendChild( cell.element );
    } );
    return fragment;
  }

  // -------------------------- add/remove cell prototype -------------------------- //

  var proto = Flickity.prototype;

  /**
   * Insert, prepend, or append cells
   * @param {[Element, Array, NodeList]} elems - Elements to insert
   * @param {Integer} index - Zero-based number to insert
   */
  proto.insert = function( elems, index ) {
    var cells = this._makeCells( elems );
    if ( !cells || !cells.length ) {
      return;
    }
    var len = this.cells.length;
    // default to append
    index = index === undefined ? len : index;
    // add cells with document fragment
    var fragment = getCellsFragment( cells );
    // append to slider
    var isAppend = index == len;
    if ( isAppend ) {
      this.slider.appendChild( fragment );
    } else {
      var insertCellElement = this.cells[ index ].element;
      this.slider.insertBefore( fragment, insertCellElement );
    }
    // add to this.cells
    if ( index === 0 ) {
      // prepend, add to start
      this.cells = cells.concat( this.cells );
    } else if ( isAppend ) {
      // append, add to end
      this.cells = this.cells.concat( cells );
    } else {
      // insert in this.cells
      var endCells = this.cells.splice( index, len - index );
      this.cells = this.cells.concat( cells ).concat( endCells );
    }

    this._sizeCells( cells );
    this.cellChange( index, true );
  };

  proto.append = function( elems ) {
    this.insert( elems, this.cells.length );
  };

  proto.prepend = function( elems ) {
    this.insert( elems, 0 );
  };

  /**
   * Remove cells
   * @param {[Element, Array, NodeList]} elems - ELements to remove
   */
  proto.remove = function( elems ) {
    var cells = this.getCells( elems );
    if ( !cells || !cells.length ) {
      return;
    }

    var minCellIndex = this.cells.length - 1;
    // remove cells from collection & DOM
    cells.forEach( function( cell ) {
      cell.remove();
      var index = this.cells.indexOf( cell );
      minCellIndex = Math.min( index, minCellIndex );
      utils.removeFrom( this.cells, cell );
    }, this );

    this.cellChange( minCellIndex, true );
  };

  /**
   * logic to be run after a cell's size changes
   * @param {Element} elem - cell's element
   */
  proto.cellSizeChange = function( elem ) {
    var cell = this.getCell( elem );
    if ( !cell ) {
      return;
    }
    cell.getSize();

    var index = this.cells.indexOf( cell );
    this.cellChange( index );
  };

  /**
   * logic any time a cell is changed: added, removed, or size changed
   * @param {Integer} changedCellIndex - index of the changed cell, optional
   * @param {Boolean} isPositioningSlider - Positions slider after selection
   */
  proto.cellChange = function( changedCellIndex, isPositioningSlider ) {
    var prevSelectedElem = this.selectedElement;
    this._positionCells( changedCellIndex );
    this._getWrapShiftCells();
    this.setGallerySize();
    // update selectedIndex
    // try to maintain position & select previous selected element
    var cell = this.getCell( prevSelectedElem );
    if ( cell ) {
      this.selectedIndex = this.getCellSlideIndex( cell );
    }
    this.selectedIndex = Math.min( this.slides.length - 1, this.selectedIndex );

    this.emitEvent( 'cellChange', [ changedCellIndex ] );
    // position slider
    this.select( this.selectedIndex );
    // do not position slider after lazy load
    if ( isPositioningSlider ) {
      this.positionSliderAtSelected();
    }
  };

  // -----  ----- //

  return Flickity;

  } ) );
  });

  var lazyload = createCommonjsModule(function (module) {
  // lazyload
  ( function( window, factory ) {
    // universal module definition
    if (  module.exports ) {
      // CommonJS
      module.exports = factory(
          window,
          flickity,
          utils
      );
    } else {
      // browser global
      factory(
          window,
          window.Flickity,
          window.fizzyUIUtils
      );
    }

  }( window, function factory( window, Flickity, utils ) {

  Flickity.createMethods.push('_createLazyload');
  var proto = Flickity.prototype;

  proto._createLazyload = function() {
    this.on( 'select', this.lazyLoad );
  };

  proto.lazyLoad = function() {
    var lazyLoad = this.options.lazyLoad;
    if ( !lazyLoad ) {
      return;
    }
    // get adjacent cells, use lazyLoad option for adjacent count
    var adjCount = typeof lazyLoad == 'number' ? lazyLoad : 0;
    var cellElems = this.getAdjacentCellElements( adjCount );
    // get lazy images in those cells
    var lazyImages = [];
    cellElems.forEach( function( cellElem ) {
      var lazyCellImages = getCellLazyImages( cellElem );
      lazyImages = lazyImages.concat( lazyCellImages );
    } );
    // load lazy images
    lazyImages.forEach( function( img ) {
      new LazyLoader( img, this );
    }, this );
  };

  function getCellLazyImages( cellElem ) {
    // check if cell element is lazy image
    if ( cellElem.nodeName == 'IMG' ) {
      var lazyloadAttr = cellElem.getAttribute('data-flickity-lazyload');
      var srcAttr = cellElem.getAttribute('data-flickity-lazyload-src');
      var srcsetAttr = cellElem.getAttribute('data-flickity-lazyload-srcset');
      if ( lazyloadAttr || srcAttr || srcsetAttr ) {
        return [ cellElem ];
      }
    }
    // select lazy images in cell
    var lazySelector = 'img[data-flickity-lazyload], ' +
      'img[data-flickity-lazyload-src], img[data-flickity-lazyload-srcset]';
    var imgs = cellElem.querySelectorAll( lazySelector );
    return utils.makeArray( imgs );
  }

  // -------------------------- LazyLoader -------------------------- //

  /**
   * class to handle loading images
   * @param {Image} img - Image element
   * @param {Flickity} flickity - Flickity instance
   */
  function LazyLoader( img, flickity ) {
    this.img = img;
    this.flickity = flickity;
    this.load();
  }

  LazyLoader.prototype.handleEvent = utils.handleEvent;

  LazyLoader.prototype.load = function() {
    this.img.addEventListener( 'load', this );
    this.img.addEventListener( 'error', this );
    // get src & srcset
    var src = this.img.getAttribute('data-flickity-lazyload') ||
      this.img.getAttribute('data-flickity-lazyload-src');
    var srcset = this.img.getAttribute('data-flickity-lazyload-srcset');
    // set src & serset
    this.img.src = src;
    if ( srcset ) {
      this.img.setAttribute( 'srcset', srcset );
    }
    // remove attr
    this.img.removeAttribute('data-flickity-lazyload');
    this.img.removeAttribute('data-flickity-lazyload-src');
    this.img.removeAttribute('data-flickity-lazyload-srcset');
  };

  LazyLoader.prototype.onload = function( event ) {
    this.complete( event, 'flickity-lazyloaded' );
  };

  LazyLoader.prototype.onerror = function( event ) {
    this.complete( event, 'flickity-lazyerror' );
  };

  LazyLoader.prototype.complete = function( event, className ) {
    // unbind events
    this.img.removeEventListener( 'load', this );
    this.img.removeEventListener( 'error', this );

    var cell = this.flickity.getParentCell( this.img );
    var cellElem = cell && cell.element;
    this.flickity.cellSizeChange( cellElem );

    this.img.classList.add( className );
    this.flickity.dispatchEvent( 'lazyLoad', event, cellElem );
  };

  // -----  ----- //

  Flickity.LazyLoader = LazyLoader;

  return Flickity;

  } ) );
  });

  /*!
   * Flickity v2.3.0
   * Touch, responsive, flickable carousels
   *
   * Licensed GPLv3 for open source use
   * or Flickity Commercial License for commercial use
   *
   * https://flickity.metafizzy.co
   * Copyright 2015-2021 Metafizzy
   */

  var js = createCommonjsModule(function (module) {
  ( function( window, factory ) {
    // universal module definition
    if (  module.exports ) {
      // CommonJS
      module.exports = factory(
          flickity,
          drag,
          prevNextButton,
          pageDots,
          player,
          addRemoveCell,
          lazyload
      );
    }

  } )( window, function factory( Flickity ) {
    return Flickity;
  } );
  });

  /*!
   * imagesLoaded v4.1.4
   * JavaScript is all like "You images are done yet or what?"
   * MIT License
   */

  var imagesloaded = createCommonjsModule(function (module) {
  ( function( window, factory ) {  // universal module definition

    /*global define: false, module: false, require: false */

    if (  module.exports ) {
      // CommonJS
      module.exports = factory(
        window,
        evEmitter
      );
    } else {
      // browser global
      window.imagesLoaded = factory(
        window,
        window.EvEmitter
      );
    }

  })( typeof window !== 'undefined' ? window : commonjsGlobal,

  // --------------------------  factory -------------------------- //

  function factory( window, EvEmitter ) {

  var $ = window.jQuery;
  var console = window.console;

  // -------------------------- helpers -------------------------- //

  // extend objects
  function extend( a, b ) {
    for ( var prop in b ) {
      a[ prop ] = b[ prop ];
    }
    return a;
  }

  var arraySlice = Array.prototype.slice;

  // turn element or nodeList into an array
  function makeArray( obj ) {
    if ( Array.isArray( obj ) ) {
      // use object if already an array
      return obj;
    }

    var isArrayLike = typeof obj == 'object' && typeof obj.length == 'number';
    if ( isArrayLike ) {
      // convert nodeList to array
      return arraySlice.call( obj );
    }

    // array of single index
    return [ obj ];
  }

  // -------------------------- imagesLoaded -------------------------- //

  /**
   * @param {Array, Element, NodeList, String} elem
   * @param {Object or Function} options - if function, use as callback
   * @param {Function} onAlways - callback function
   */
  function ImagesLoaded( elem, options, onAlways ) {
    // coerce ImagesLoaded() without new, to be new ImagesLoaded()
    if ( !( this instanceof ImagesLoaded ) ) {
      return new ImagesLoaded( elem, options, onAlways );
    }
    // use elem as selector string
    var queryElem = elem;
    if ( typeof elem == 'string' ) {
      queryElem = document.querySelectorAll( elem );
    }
    // bail if bad element
    if ( !queryElem ) {
      console.error( 'Bad element for imagesLoaded ' + ( queryElem || elem ) );
      return;
    }

    this.elements = makeArray( queryElem );
    this.options = extend( {}, this.options );
    // shift arguments if no options set
    if ( typeof options == 'function' ) {
      onAlways = options;
    } else {
      extend( this.options, options );
    }

    if ( onAlways ) {
      this.on( 'always', onAlways );
    }

    this.getImages();

    if ( $ ) {
      // add jQuery Deferred object
      this.jqDeferred = new $.Deferred();
    }

    // HACK check async to allow time to bind listeners
    setTimeout( this.check.bind( this ) );
  }

  ImagesLoaded.prototype = Object.create( EvEmitter.prototype );

  ImagesLoaded.prototype.options = {};

  ImagesLoaded.prototype.getImages = function() {
    this.images = [];

    // filter & find items if we have an item selector
    this.elements.forEach( this.addElementImages, this );
  };

  /**
   * @param {Node} element
   */
  ImagesLoaded.prototype.addElementImages = function( elem ) {
    // filter siblings
    if ( elem.nodeName == 'IMG' ) {
      this.addImage( elem );
    }
    // get background image on element
    if ( this.options.background === true ) {
      this.addElementBackgroundImages( elem );
    }

    // find children
    // no non-element nodes, #143
    var nodeType = elem.nodeType;
    if ( !nodeType || !elementNodeTypes[ nodeType ] ) {
      return;
    }
    var childImgs = elem.querySelectorAll('img');
    // concat childElems to filterFound array
    for ( var i=0; i < childImgs.length; i++ ) {
      var img = childImgs[i];
      this.addImage( img );
    }

    // get child background images
    if ( typeof this.options.background == 'string' ) {
      var children = elem.querySelectorAll( this.options.background );
      for ( i=0; i < children.length; i++ ) {
        var child = children[i];
        this.addElementBackgroundImages( child );
      }
    }
  };

  var elementNodeTypes = {
    1: true,
    9: true,
    11: true
  };

  ImagesLoaded.prototype.addElementBackgroundImages = function( elem ) {
    var style = getComputedStyle( elem );
    if ( !style ) {
      // Firefox returns null if in a hidden iframe https://bugzil.la/548397
      return;
    }
    // get url inside url("...")
    var reURL = /url\((['"])?(.*?)\1\)/gi;
    var matches = reURL.exec( style.backgroundImage );
    while ( matches !== null ) {
      var url = matches && matches[2];
      if ( url ) {
        this.addBackground( url, elem );
      }
      matches = reURL.exec( style.backgroundImage );
    }
  };

  /**
   * @param {Image} img
   */
  ImagesLoaded.prototype.addImage = function( img ) {
    var loadingImage = new LoadingImage( img );
    this.images.push( loadingImage );
  };

  ImagesLoaded.prototype.addBackground = function( url, elem ) {
    var background = new Background( url, elem );
    this.images.push( background );
  };

  ImagesLoaded.prototype.check = function() {
    var _this = this;
    this.progressedCount = 0;
    this.hasAnyBroken = false;
    // complete if no images
    if ( !this.images.length ) {
      this.complete();
      return;
    }

    function onProgress( image, elem, message ) {
      // HACK - Chrome triggers event before object properties have changed. #83
      setTimeout( function() {
        _this.progress( image, elem, message );
      });
    }

    this.images.forEach( function( loadingImage ) {
      loadingImage.once( 'progress', onProgress );
      loadingImage.check();
    });
  };

  ImagesLoaded.prototype.progress = function( image, elem, message ) {
    this.progressedCount++;
    this.hasAnyBroken = this.hasAnyBroken || !image.isLoaded;
    // progress event
    this.emitEvent( 'progress', [ this, image, elem ] );
    if ( this.jqDeferred && this.jqDeferred.notify ) {
      this.jqDeferred.notify( this, image );
    }
    // check if completed
    if ( this.progressedCount == this.images.length ) {
      this.complete();
    }

    if ( this.options.debug && console ) {
      console.log( 'progress: ' + message, image, elem );
    }
  };

  ImagesLoaded.prototype.complete = function() {
    var eventName = this.hasAnyBroken ? 'fail' : 'done';
    this.isComplete = true;
    this.emitEvent( eventName, [ this ] );
    this.emitEvent( 'always', [ this ] );
    if ( this.jqDeferred ) {
      var jqMethod = this.hasAnyBroken ? 'reject' : 'resolve';
      this.jqDeferred[ jqMethod ]( this );
    }
  };

  // --------------------------  -------------------------- //

  function LoadingImage( img ) {
    this.img = img;
  }

  LoadingImage.prototype = Object.create( EvEmitter.prototype );

  LoadingImage.prototype.check = function() {
    // If complete is true and browser supports natural sizes,
    // try to check for image status manually.
    var isComplete = this.getIsImageComplete();
    if ( isComplete ) {
      // report based on naturalWidth
      this.confirm( this.img.naturalWidth !== 0, 'naturalWidth' );
      return;
    }

    // If none of the checks above matched, simulate loading on detached element.
    this.proxyImage = new Image();
    this.proxyImage.addEventListener( 'load', this );
    this.proxyImage.addEventListener( 'error', this );
    // bind to image as well for Firefox. #191
    this.img.addEventListener( 'load', this );
    this.img.addEventListener( 'error', this );
    this.proxyImage.src = this.img.src;
  };

  LoadingImage.prototype.getIsImageComplete = function() {
    // check for non-zero, non-undefined naturalWidth
    // fixes Safari+InfiniteScroll+Masonry bug infinite-scroll#671
    return this.img.complete && this.img.naturalWidth;
  };

  LoadingImage.prototype.confirm = function( isLoaded, message ) {
    this.isLoaded = isLoaded;
    this.emitEvent( 'progress', [ this, this.img, message ] );
  };

  // ----- events ----- //

  // trigger specified handler for event type
  LoadingImage.prototype.handleEvent = function( event ) {
    var method = 'on' + event.type;
    if ( this[ method ] ) {
      this[ method ]( event );
    }
  };

  LoadingImage.prototype.onload = function() {
    this.confirm( true, 'onload' );
    this.unbindEvents();
  };

  LoadingImage.prototype.onerror = function() {
    this.confirm( false, 'onerror' );
    this.unbindEvents();
  };

  LoadingImage.prototype.unbindEvents = function() {
    this.proxyImage.removeEventListener( 'load', this );
    this.proxyImage.removeEventListener( 'error', this );
    this.img.removeEventListener( 'load', this );
    this.img.removeEventListener( 'error', this );
  };

  // -------------------------- Background -------------------------- //

  function Background( url, element ) {
    this.url = url;
    this.element = element;
    this.img = new Image();
  }

  // inherit LoadingImage prototype
  Background.prototype = Object.create( LoadingImage.prototype );

  Background.prototype.check = function() {
    this.img.addEventListener( 'load', this );
    this.img.addEventListener( 'error', this );
    this.img.src = this.url;
    // check if image is already complete
    var isComplete = this.getIsImageComplete();
    if ( isComplete ) {
      this.confirm( this.img.naturalWidth !== 0, 'naturalWidth' );
      this.unbindEvents();
    }
  };

  Background.prototype.unbindEvents = function() {
    this.img.removeEventListener( 'load', this );
    this.img.removeEventListener( 'error', this );
  };

  Background.prototype.confirm = function( isLoaded, message ) {
    this.isLoaded = isLoaded;
    this.emitEvent( 'progress', [ this, this.element, message ] );
  };

  // -------------------------- jQuery -------------------------- //

  ImagesLoaded.makeJQueryPlugin = function( jQuery ) {
    jQuery = jQuery || window.jQuery;
    if ( !jQuery ) {
      return;
    }
    // set local variable
    $ = jQuery;
    // $().imagesLoaded()
    $.fn.imagesLoaded = function( options, callback ) {
      var instance = new ImagesLoaded( this, options, callback );
      return instance.jqDeferred.promise( $(this) );
    };
  };
  // try making plugin
  ImagesLoaded.makeJQueryPlugin();

  // --------------------------  -------------------------- //

  return ImagesLoaded;

  });
  });

  /*!
   * Flickity imagesLoaded v2.0.0
   * enables imagesLoaded option for Flickity
   */

  var flickityImagesloaded = createCommonjsModule(function (module) {
  /*jshint browser: true, strict: true, undef: true, unused: true */

  ( function( window, factory ) {
    // universal module definition
    /*jshint strict: false */ /*globals define, module, require */
    if (  module.exports ) {
      // CommonJS
      module.exports = factory(
        window,
        js,
        imagesloaded
      );
    } else {
      // browser global
      window.Flickity = factory(
        window,
        window.Flickity,
        window.imagesLoaded
      );
    }

  }( window, function factory( window, Flickity, imagesLoaded ) {

  Flickity.createMethods.push('_createImagesLoaded');

  var proto = Flickity.prototype;

  proto._createImagesLoaded = function() {
    this.on( 'activate', this.imagesLoaded );
  };

  proto.imagesLoaded = function() {
    if ( !this.options.imagesLoaded ) {
      return;
    }
    var _this = this;
    function onImagesLoadedProgress( instance, image ) {
      var cell = _this.getParentCell( image.img );
      _this.cellSizeChange( cell && cell.element );
      if ( !_this.options.freeScroll ) {
        _this.positionSliderAtSelected();
      }
    }
    imagesLoaded( this.slider ).on( 'progress', onImagesLoadedProgress );
  };

  return Flickity;

  }));
  });

  /*!
   * Flickity asNavFor v2.0.1
   * enable asNavFor for Flickity
   */

  var asNavFor = createCommonjsModule(function (module) {
  /*jshint browser: true, undef: true, unused: true, strict: true*/

  ( function( window, factory ) {
    // universal module definition
    /*jshint strict: false */ /*globals define, module, require */
    if (  module.exports ) {
      // CommonJS
      module.exports = factory(
        js,
        utils
      );
    } else {
      // browser global
      window.Flickity = factory(
        window.Flickity,
        window.fizzyUIUtils
      );
    }

  }( window, function factory( Flickity, utils ) {

  // -------------------------- asNavFor prototype -------------------------- //

  // Flickity.defaults.asNavFor = null;

  Flickity.createMethods.push('_createAsNavFor');

  var proto = Flickity.prototype;

  proto._createAsNavFor = function() {
    this.on( 'activate', this.activateAsNavFor );
    this.on( 'deactivate', this.deactivateAsNavFor );
    this.on( 'destroy', this.destroyAsNavFor );

    var asNavForOption = this.options.asNavFor;
    if ( !asNavForOption ) {
      return;
    }
    // HACK do async, give time for other flickity to be initalized
    var _this = this;
    setTimeout( function initNavCompanion() {
      _this.setNavCompanion( asNavForOption );
    });
  };

  proto.setNavCompanion = function( elem ) {
    elem = utils.getQueryElement( elem );
    var companion = Flickity.data( elem );
    // stop if no companion or companion is self
    if ( !companion || companion == this ) {
      return;
    }

    this.navCompanion = companion;
    // companion select
    var _this = this;
    this.onNavCompanionSelect = function() {
      _this.navCompanionSelect();
    };
    companion.on( 'select', this.onNavCompanionSelect );
    // click
    this.on( 'staticClick', this.onNavStaticClick );

    this.navCompanionSelect( true );
  };

  proto.navCompanionSelect = function( isInstant ) {
    if ( !this.navCompanion ) {
      return;
    }
    // select slide that matches first cell of slide
    var selectedCell = this.navCompanion.selectedCells[0];
    var firstIndex = this.navCompanion.cells.indexOf( selectedCell );
    var lastIndex = firstIndex + this.navCompanion.selectedCells.length - 1;
    var selectIndex = Math.floor( lerp( firstIndex, lastIndex,
      this.navCompanion.cellAlign ) );
    this.selectCell( selectIndex, false, isInstant );
    // set nav selected class
    this.removeNavSelectedElements();
    // stop if companion has more cells than this one
    if ( selectIndex >= this.cells.length ) {
      return;
    }

    var selectedCells = this.cells.slice( firstIndex, lastIndex + 1 );
    this.navSelectedElements = selectedCells.map( function( cell ) {
      return cell.element;
    });
    this.changeNavSelectedClass('add');
  };

  function lerp( a, b, t ) {
    return ( b - a ) * t + a;
  }

  proto.changeNavSelectedClass = function( method ) {
    this.navSelectedElements.forEach( function( navElem ) {
      navElem.classList[ method ]('is-nav-selected');
    });
  };

  proto.activateAsNavFor = function() {
    this.navCompanionSelect( true );
  };

  proto.removeNavSelectedElements = function() {
    if ( !this.navSelectedElements ) {
      return;
    }
    this.changeNavSelectedClass('remove');
    delete this.navSelectedElements;
  };

  proto.onNavStaticClick = function( event, pointer, cellElement, cellIndex ) {
    if ( typeof cellIndex == 'number' ) {
      this.navCompanion.selectCell( cellIndex );
    }
  };

  proto.deactivateAsNavFor = function() {
    this.removeNavSelectedElements();
  };

  proto.destroyAsNavFor = function() {
    if ( !this.navCompanion ) {
      return;
    }
    this.navCompanion.off( 'select', this.onNavCompanionSelect );
    this.off( 'staticClick', this.onNavStaticClick );
    delete this.navCompanion;
  };

  // -----  ----- //

  return Flickity;

  }));
  });

  /**
   * Flickity fade v1.0.0
   * Fade between Flickity slides
   */

  var flickityFade = createCommonjsModule(function (module) {
  /* jshint browser: true, undef: true, unused: true */

  ( function( window, factory ) {
    // universal module definition
    /*globals define, module, require */
    if (  module.exports ) {
      // CommonJS
      module.exports = factory(
        js,
        utils
      );
    } else {
      // browser global
      factory(
        window.Flickity,
        window.fizzyUIUtils
      );
    }

  }( commonjsGlobal, function factory( Flickity, utils ) {

  // ---- Slide ---- //

  var Slide = Flickity.Slide;

  var slideUpdateTarget = Slide.prototype.updateTarget;
  Slide.prototype.updateTarget = function() {
    slideUpdateTarget.apply( this, arguments );
    if ( !this.parent.options.fade ) {
      return;
    }
    // position cells at selected target
    var slideTargetX = this.target - this.x;
    var firstCellX = this.cells[0].x;
    this.cells.forEach( function( cell ) {
      var targetX = cell.x - firstCellX - slideTargetX;
      cell.renderPosition( targetX );
    });
  };

  Slide.prototype.setOpacity = function( alpha ) {
    this.cells.forEach( function( cell ) {
      cell.element.style.opacity = alpha;
    });
  };

  // ---- Flickity ---- //

  var proto = Flickity.prototype;

  Flickity.createMethods.push('_createFade');

  proto._createFade = function() {
    this.fadeIndex = this.selectedIndex;
    this.prevSelectedIndex = this.selectedIndex;
    this.on( 'select', this.onSelectFade );
    this.on( 'dragEnd', this.onDragEndFade );
    this.on( 'settle', this.onSettleFade );
    this.on( 'activate', this.onActivateFade );
    this.on( 'deactivate', this.onDeactivateFade );
  };

  var updateSlides = proto.updateSlides;
  proto.updateSlides = function() {
    updateSlides.apply( this, arguments );
    if ( !this.options.fade ) {
      return;
    }
    // set initial opacity
    this.slides.forEach( function( slide, i ) {
      var alpha = i == this.selectedIndex ? 1 : 0;
      slide.setOpacity( alpha );
    }, this );
  };

  /* ---- events ---- */

  proto.onSelectFade = function() {
    // in case of resize, keep fadeIndex within current count
    this.fadeIndex = Math.min( this.prevSelectedIndex, this.slides.length - 1 );
    this.prevSelectedIndex = this.selectedIndex;
  };

  proto.onSettleFade = function() {
    delete this.didDragEnd;
    if ( !this.options.fade ) {
      return;
    }
    // set full and 0 opacity on selected & faded slides
    this.selectedSlide.setOpacity( 1 );
    var fadedSlide = this.slides[ this.fadeIndex ];
    if ( fadedSlide && this.fadeIndex != this.selectedIndex ) {
      this.slides[ this.fadeIndex ].setOpacity( 0 );
    }
  };

  proto.onDragEndFade = function() {
    // set flag
    this.didDragEnd = true;
  };

  proto.onActivateFade = function() {
    if ( this.options.fade ) {
      this.element.classList.add('is-fade');
    }
  };

  proto.onDeactivateFade = function() {
    if ( !this.options.fade ) {
      return;
    }
    this.element.classList.remove('is-fade');
    // reset opacity
    this.slides.forEach( function( slide ) {
      slide.setOpacity('');
    });
  };

  /* ---- position & fading ---- */

  var positionSlider = proto.positionSlider;
  proto.positionSlider = function() {
    if ( !this.options.fade ) {
      positionSlider.apply( this, arguments );
      return;
    }

    this.fadeSlides();
    this.dispatchScrollEvent();
  };

  var positionSliderAtSelected = proto.positionSliderAtSelected;
  proto.positionSliderAtSelected = function() {
    if ( this.options.fade ) {
      // position fade slider at origin
      this.setTranslateX( 0 );
    }
    positionSliderAtSelected.apply( this, arguments );
  };

  proto.fadeSlides = function() {
    if ( this.slides.length < 2 ) {
      return;
    }
    // get slides to fade-in & fade-out
    var indexes = this.getFadeIndexes();
    var fadeSlideA = this.slides[ indexes.a ];
    var fadeSlideB = this.slides[ indexes.b ];
    var distance = this.wrapDifference( fadeSlideA.target, fadeSlideB.target );
    var progress = this.wrapDifference( fadeSlideA.target, -this.x );
    progress = progress / distance;

    fadeSlideA.setOpacity( 1 - progress );
    fadeSlideB.setOpacity( progress );

    // hide previous slide
    var fadeHideIndex = indexes.a;
    if ( this.isDragging ) {
      fadeHideIndex = progress > 0.5 ? indexes.a : indexes.b;
    }
    var isNewHideIndex = this.fadeHideIndex != undefined &&
      this.fadeHideIndex != fadeHideIndex &&
      this.fadeHideIndex != indexes.a &&
      this.fadeHideIndex != indexes.b;
    if ( isNewHideIndex ) {
      // new fadeHideSlide set, hide previous
      this.slides[ this.fadeHideIndex ].setOpacity( 0 );
    }
    this.fadeHideIndex = fadeHideIndex;
  };

  proto.getFadeIndexes = function() {
    if ( !this.isDragging && !this.didDragEnd ) {
      return {
        a: this.fadeIndex,
        b: this.selectedIndex,
      };
    }
    if ( this.options.wrapAround ) {
      return this.getFadeDragWrapIndexes();
    } else {
      return this.getFadeDragLimitIndexes();
    }
  };

  proto.getFadeDragWrapIndexes = function() {
    var distances = this.slides.map( function( slide, i ) {
      return this.getSlideDistance( -this.x, i );
    }, this );
    var absDistances = distances.map( function( distance ) {
      return Math.abs( distance );
    });
    var minDistance = Math.min.apply( Math, absDistances );
    var closestIndex = absDistances.indexOf( minDistance );
    var distance = distances[ closestIndex ];
    var len = this.slides.length;

    var delta = distance >= 0 ? 1 : -1;
    return {
      a: closestIndex,
      b: utils.modulo( closestIndex + delta, len ),
    };
  };

  proto.getFadeDragLimitIndexes = function() {
    // calculate closest previous slide
    var dragIndex = 0;
    for ( var i=0; i < this.slides.length - 1; i++ ) {
      var slide = this.slides[i];
      if ( -this.x < slide.target ) {
        break;
      }
      dragIndex = i;
    }
    return {
      a: dragIndex,
      b: dragIndex + 1,
    };
  };

  proto.wrapDifference = function( a, b ) {
    var diff = b - a;

    if ( !this.options.wrapAround ) {
      return diff;
    }

    var diffPlus = diff + this.slideableWidth;
    var diffMinus = diff - this.slideableWidth;
    if ( Math.abs( diffPlus ) < Math.abs( diff ) ) {
      diff = diffPlus;
    }
    if ( Math.abs( diffMinus ) < Math.abs( diff ) ) {
      diff = diffMinus;
    }
    return diff;
  };

  // ---- wrapAround ---- //

  var _getWrapShiftCells = proto._getWrapShiftCells;
  proto._getWrapShiftCells = function() {
    if ( !this.options.fade ) {
      _getWrapShiftCells.apply( this, arguments );
    }
  };

  var shiftWrapCells = proto.shiftWrapCells;
  proto.shiftWrapCells = function() {
    if ( !this.options.fade ) {
      shiftWrapCells.apply( this, arguments );
    }
  };

  return Flickity;

  }));
  });

  var scrollLock = createCommonjsModule(function (module, exports) {
  (function webpackUniversalModuleDefinition(root, factory) {
  	module.exports = factory();
  })(commonjsGlobal, function() {
  return /******/ (function(modules) { // webpackBootstrap
  /******/ 	// The module cache
  /******/ 	var installedModules = {};
  /******/
  /******/ 	// The require function
  /******/ 	function __webpack_require__(moduleId) {
  /******/
  /******/ 		// Check if module is in cache
  /******/ 		if(installedModules[moduleId]) {
  /******/ 			return installedModules[moduleId].exports;
  /******/ 		}
  /******/ 		// Create a new module (and put it into the cache)
  /******/ 		var module = installedModules[moduleId] = {
  /******/ 			i: moduleId,
  /******/ 			l: false,
  /******/ 			exports: {}
  /******/ 		};
  /******/
  /******/ 		// Execute the module function
  /******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
  /******/
  /******/ 		// Flag the module as loaded
  /******/ 		module.l = true;
  /******/
  /******/ 		// Return the exports of the module
  /******/ 		return module.exports;
  /******/ 	}
  /******/
  /******/
  /******/ 	// expose the modules object (__webpack_modules__)
  /******/ 	__webpack_require__.m = modules;
  /******/
  /******/ 	// expose the module cache
  /******/ 	__webpack_require__.c = installedModules;
  /******/
  /******/ 	// define getter function for harmony exports
  /******/ 	__webpack_require__.d = function(exports, name, getter) {
  /******/ 		if(!__webpack_require__.o(exports, name)) {
  /******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
  /******/ 		}
  /******/ 	};
  /******/
  /******/ 	// define __esModule on exports
  /******/ 	__webpack_require__.r = function(exports) {
  /******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
  /******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
  /******/ 		}
  /******/ 		Object.defineProperty(exports, '__esModule', { value: true });
  /******/ 	};
  /******/
  /******/ 	// create a fake namespace object
  /******/ 	// mode & 1: value is a module id, require it
  /******/ 	// mode & 2: merge all properties of value into the ns
  /******/ 	// mode & 4: return value when already ns object
  /******/ 	// mode & 8|1: behave like require
  /******/ 	__webpack_require__.t = function(value, mode) {
  /******/ 		if(mode & 1) value = __webpack_require__(value);
  /******/ 		if(mode & 8) return value;
  /******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
  /******/ 		var ns = Object.create(null);
  /******/ 		__webpack_require__.r(ns);
  /******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
  /******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
  /******/ 		return ns;
  /******/ 	};
  /******/
  /******/ 	// getDefaultExport function for compatibility with non-harmony modules
  /******/ 	__webpack_require__.n = function(module) {
  /******/ 		var getter = module && module.__esModule ?
  /******/ 			function getDefault() { return module['default']; } :
  /******/ 			function getModuleExports() { return module; };
  /******/ 		__webpack_require__.d(getter, 'a', getter);
  /******/ 		return getter;
  /******/ 	};
  /******/
  /******/ 	// Object.prototype.hasOwnProperty.call
  /******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
  /******/
  /******/ 	// __webpack_public_path__
  /******/ 	__webpack_require__.p = "";
  /******/
  /******/
  /******/ 	// Load entry module and return exports
  /******/ 	return __webpack_require__(__webpack_require__.s = 0);
  /******/ })
  /************************************************************************/
  /******/ ([
  /* 0 */
  /***/ (function(module, __webpack_exports__, __webpack_require__) {
  __webpack_require__.r(__webpack_exports__);

  // CONCATENATED MODULE: ./src/tools.js
  var argumentAsArray = function argumentAsArray(argument) {
    return Array.isArray(argument) ? argument : [argument];
  };
  var isElement = function isElement(target) {
    return target instanceof Node;
  };
  var isElementList = function isElementList(nodeList) {
    return nodeList instanceof NodeList;
  };
  var eachNode = function eachNode(nodeList, callback) {
    if (nodeList && callback) {
      nodeList = isElementList(nodeList) ? nodeList : [nodeList];

      for (var i = 0; i < nodeList.length; i++) {
        if (callback(nodeList[i], i, nodeList.length) === true) {
          break;
        }
      }
    }
  };
  var throwError = function throwError(message) {
    return console.error("[scroll-lock] ".concat(message));
  };
  var arrayAsSelector = function arrayAsSelector(array) {
    if (Array.isArray(array)) {
      var selector = array.join(', ');
      return selector;
    }
  };
  var nodeListAsArray = function nodeListAsArray(nodeList) {
    var nodes = [];
    eachNode(nodeList, function (node) {
      return nodes.push(node);
    });
    return nodes;
  };
  var findParentBySelector = function findParentBySelector($el, selector) {
    var self = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    var $root = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : document;

    if (self && nodeListAsArray($root.querySelectorAll(selector)).indexOf($el) !== -1) {
      return $el;
    }

    while (($el = $el.parentElement) && nodeListAsArray($root.querySelectorAll(selector)).indexOf($el) === -1) {
    }

    return $el;
  };
  var elementHasSelector = function elementHasSelector($el, selector) {
    var $root = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : document;
    var has = nodeListAsArray($root.querySelectorAll(selector)).indexOf($el) !== -1;
    return has;
  };
  var elementHasOverflowHidden = function elementHasOverflowHidden($el) {
    if ($el) {
      var computedStyle = getComputedStyle($el);
      var overflowIsHidden = computedStyle.overflow === 'hidden';
      return overflowIsHidden;
    }
  };
  var elementScrollTopOnStart = function elementScrollTopOnStart($el) {
    if ($el) {
      if (elementHasOverflowHidden($el)) {
        return true;
      }

      var scrollTop = $el.scrollTop;
      return scrollTop <= 0;
    }
  };
  var elementScrollTopOnEnd = function elementScrollTopOnEnd($el) {
    if ($el) {
      if (elementHasOverflowHidden($el)) {
        return true;
      }

      var scrollTop = $el.scrollTop;
      var scrollHeight = $el.scrollHeight;
      var scrollTopWithHeight = scrollTop + $el.offsetHeight;
      return scrollTopWithHeight >= scrollHeight;
    }
  };
  var elementScrollLeftOnStart = function elementScrollLeftOnStart($el) {
    if ($el) {
      if (elementHasOverflowHidden($el)) {
        return true;
      }

      var scrollLeft = $el.scrollLeft;
      return scrollLeft <= 0;
    }
  };
  var elementScrollLeftOnEnd = function elementScrollLeftOnEnd($el) {
    if ($el) {
      if (elementHasOverflowHidden($el)) {
        return true;
      }

      var scrollLeft = $el.scrollLeft;
      var scrollWidth = $el.scrollWidth;
      var scrollLeftWithWidth = scrollLeft + $el.offsetWidth;
      return scrollLeftWithWidth >= scrollWidth;
    }
  };
  var elementIsScrollableField = function elementIsScrollableField($el) {
    var selector = 'textarea, [contenteditable="true"]';
    return elementHasSelector($el, selector);
  };
  var elementIsInputRange = function elementIsInputRange($el) {
    var selector = 'input[type="range"]';
    return elementHasSelector($el, selector);
  };
  // CONCATENATED MODULE: ./src/scroll-lock.js
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "disablePageScroll", function() { return disablePageScroll; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "enablePageScroll", function() { return enablePageScroll; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getScrollState", function() { return getScrollState; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "clearQueueScrollLocks", function() { return clearQueueScrollLocks; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getTargetScrollBarWidth", function() { return scroll_lock_getTargetScrollBarWidth; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getCurrentTargetScrollBarWidth", function() { return scroll_lock_getCurrentTargetScrollBarWidth; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getPageScrollBarWidth", function() { return getPageScrollBarWidth; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getCurrentPageScrollBarWidth", function() { return getCurrentPageScrollBarWidth; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addScrollableTarget", function() { return scroll_lock_addScrollableTarget; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "removeScrollableTarget", function() { return scroll_lock_removeScrollableTarget; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addScrollableSelector", function() { return scroll_lock_addScrollableSelector; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "removeScrollableSelector", function() { return scroll_lock_removeScrollableSelector; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addLockableTarget", function() { return scroll_lock_addLockableTarget; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addLockableSelector", function() { return scroll_lock_addLockableSelector; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setFillGapMethod", function() { return scroll_lock_setFillGapMethod; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addFillGapTarget", function() { return scroll_lock_addFillGapTarget; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "removeFillGapTarget", function() { return scroll_lock_removeFillGapTarget; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addFillGapSelector", function() { return scroll_lock_addFillGapSelector; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "removeFillGapSelector", function() { return scroll_lock_removeFillGapSelector; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "refillGaps", function() { return refillGaps; });
  function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }


  var FILL_GAP_AVAILABLE_METHODS = ['padding', 'margin', 'width', 'max-width', 'none'];
  var TOUCH_DIRECTION_DETECT_OFFSET = 3;
  var state = {
    scroll: true,
    queue: 0,
    scrollableSelectors: ['[data-scroll-lock-scrollable]'],
    lockableSelectors: ['body', '[data-scroll-lock-lockable]'],
    fillGapSelectors: ['body', '[data-scroll-lock-fill-gap]', '[data-scroll-lock-lockable]'],
    fillGapMethod: FILL_GAP_AVAILABLE_METHODS[0],
    //
    startTouchY: 0,
    startTouchX: 0
  };
  var disablePageScroll = function disablePageScroll(target) {
    if (state.queue <= 0) {
      state.scroll = false;
      scroll_lock_hideLockableOverflow();
      fillGaps();
    }

    scroll_lock_addScrollableTarget(target);
    state.queue++;
  };
  var enablePageScroll = function enablePageScroll(target) {
    state.queue > 0 && state.queue--;

    if (state.queue <= 0) {
      state.scroll = true;
      scroll_lock_showLockableOverflow();
      unfillGaps();
    }

    scroll_lock_removeScrollableTarget(target);
  };
  var getScrollState = function getScrollState() {
    return state.scroll;
  };
  var clearQueueScrollLocks = function clearQueueScrollLocks() {
    state.queue = 0;
  };
  var scroll_lock_getTargetScrollBarWidth = function getTargetScrollBarWidth($target) {
    var onlyExists = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    if (isElement($target)) {
      var currentOverflowYProperty = $target.style.overflowY;

      if (onlyExists) {
        if (!getScrollState()) {
          $target.style.overflowY = $target.getAttribute('data-scroll-lock-saved-overflow-y-property');
        }
      } else {
        $target.style.overflowY = 'scroll';
      }

      var width = scroll_lock_getCurrentTargetScrollBarWidth($target);
      $target.style.overflowY = currentOverflowYProperty;
      return width;
    } else {
      return 0;
    }
  };
  var scroll_lock_getCurrentTargetScrollBarWidth = function getCurrentTargetScrollBarWidth($target) {
    if (isElement($target)) {
      if ($target === document.body) {
        var documentWidth = document.documentElement.clientWidth;
        var windowWidth = window.innerWidth;
        var currentWidth = windowWidth - documentWidth;
        return currentWidth;
      } else {
        var borderLeftWidthCurrentProperty = $target.style.borderLeftWidth;
        var borderRightWidthCurrentProperty = $target.style.borderRightWidth;
        $target.style.borderLeftWidth = '0px';
        $target.style.borderRightWidth = '0px';

        var _currentWidth = $target.offsetWidth - $target.clientWidth;

        $target.style.borderLeftWidth = borderLeftWidthCurrentProperty;
        $target.style.borderRightWidth = borderRightWidthCurrentProperty;
        return _currentWidth;
      }
    } else {
      return 0;
    }
  };
  var getPageScrollBarWidth = function getPageScrollBarWidth() {
    var onlyExists = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    return scroll_lock_getTargetScrollBarWidth(document.body, onlyExists);
  };
  var getCurrentPageScrollBarWidth = function getCurrentPageScrollBarWidth() {
    return scroll_lock_getCurrentTargetScrollBarWidth(document.body);
  };
  var scroll_lock_addScrollableTarget = function addScrollableTarget(target) {
    if (target) {
      var targets = argumentAsArray(target);
      targets.map(function ($targets) {
        eachNode($targets, function ($target) {
          if (isElement($target)) {
            $target.setAttribute('data-scroll-lock-scrollable', '');
          } else {
            throwError("\"".concat($target, "\" is not a Element."));
          }
        });
      });
    }
  };
  var scroll_lock_removeScrollableTarget = function removeScrollableTarget(target) {
    if (target) {
      var targets = argumentAsArray(target);
      targets.map(function ($targets) {
        eachNode($targets, function ($target) {
          if (isElement($target)) {
            $target.removeAttribute('data-scroll-lock-scrollable');
          } else {
            throwError("\"".concat($target, "\" is not a Element."));
          }
        });
      });
    }
  };
  var scroll_lock_addScrollableSelector = function addScrollableSelector(selector) {
    if (selector) {
      var selectors = argumentAsArray(selector);
      selectors.map(function (selector) {
        state.scrollableSelectors.push(selector);
      });
    }
  };
  var scroll_lock_removeScrollableSelector = function removeScrollableSelector(selector) {
    if (selector) {
      var selectors = argumentAsArray(selector);
      selectors.map(function (selector) {
        state.scrollableSelectors = state.scrollableSelectors.filter(function (sSelector) {
          return sSelector !== selector;
        });
      });
    }
  };
  var scroll_lock_addLockableTarget = function addLockableTarget(target) {
    if (target) {
      var targets = argumentAsArray(target);
      targets.map(function ($targets) {
        eachNode($targets, function ($target) {
          if (isElement($target)) {
            $target.setAttribute('data-scroll-lock-lockable', '');
          } else {
            throwError("\"".concat($target, "\" is not a Element."));
          }
        });
      });

      if (!getScrollState()) {
        scroll_lock_hideLockableOverflow();
      }
    }
  };
  var scroll_lock_addLockableSelector = function addLockableSelector(selector) {
    if (selector) {
      var selectors = argumentAsArray(selector);
      selectors.map(function (selector) {
        state.lockableSelectors.push(selector);
      });

      if (!getScrollState()) {
        scroll_lock_hideLockableOverflow();
      }

      scroll_lock_addFillGapSelector(selector);
    }
  };
  var scroll_lock_setFillGapMethod = function setFillGapMethod(method) {
    if (method) {
      if (FILL_GAP_AVAILABLE_METHODS.indexOf(method) !== -1) {
        state.fillGapMethod = method;
        refillGaps();
      } else {
        var methods = FILL_GAP_AVAILABLE_METHODS.join(', ');
        throwError("\"".concat(method, "\" method is not available!\nAvailable fill gap methods: ").concat(methods, "."));
      }
    }
  };
  var scroll_lock_addFillGapTarget = function addFillGapTarget(target) {
    if (target) {
      var targets = argumentAsArray(target);
      targets.map(function ($targets) {
        eachNode($targets, function ($target) {
          if (isElement($target)) {
            $target.setAttribute('data-scroll-lock-fill-gap', '');

            if (!state.scroll) {
              scroll_lock_fillGapTarget($target);
            }
          } else {
            throwError("\"".concat($target, "\" is not a Element."));
          }
        });
      });
    }
  };
  var scroll_lock_removeFillGapTarget = function removeFillGapTarget(target) {
    if (target) {
      var targets = argumentAsArray(target);
      targets.map(function ($targets) {
        eachNode($targets, function ($target) {
          if (isElement($target)) {
            $target.removeAttribute('data-scroll-lock-fill-gap');

            if (!state.scroll) {
              scroll_lock_unfillGapTarget($target);
            }
          } else {
            throwError("\"".concat($target, "\" is not a Element."));
          }
        });
      });
    }
  };
  var scroll_lock_addFillGapSelector = function addFillGapSelector(selector) {
    if (selector) {
      var selectors = argumentAsArray(selector);
      selectors.map(function (selector) {
        if (state.fillGapSelectors.indexOf(selector) === -1) {
          state.fillGapSelectors.push(selector);

          if (!state.scroll) {
            scroll_lock_fillGapSelector(selector);
          }
        }
      });
    }
  };
  var scroll_lock_removeFillGapSelector = function removeFillGapSelector(selector) {
    if (selector) {
      var selectors = argumentAsArray(selector);
      selectors.map(function (selector) {
        state.fillGapSelectors = state.fillGapSelectors.filter(function (fSelector) {
          return fSelector !== selector;
        });

        if (!state.scroll) {
          scroll_lock_unfillGapSelector(selector);
        }
      });
    }
  };
  var refillGaps = function refillGaps() {
    if (!state.scroll) {
      fillGaps();
    }
  };

  var scroll_lock_hideLockableOverflow = function hideLockableOverflow() {
    var selector = arrayAsSelector(state.lockableSelectors);
    scroll_lock_hideLockableOverflowSelector(selector);
  };

  var scroll_lock_showLockableOverflow = function showLockableOverflow() {
    var selector = arrayAsSelector(state.lockableSelectors);
    scroll_lock_showLockableOverflowSelector(selector);
  };

  var scroll_lock_hideLockableOverflowSelector = function hideLockableOverflowSelector(selector) {
    var $targets = document.querySelectorAll(selector);
    eachNode($targets, function ($target) {
      scroll_lock_hideLockableOverflowTarget($target);
    });
  };

  var scroll_lock_showLockableOverflowSelector = function showLockableOverflowSelector(selector) {
    var $targets = document.querySelectorAll(selector);
    eachNode($targets, function ($target) {
      scroll_lock_showLockableOverflowTarget($target);
    });
  };

  var scroll_lock_hideLockableOverflowTarget = function hideLockableOverflowTarget($target) {
    if (isElement($target) && $target.getAttribute('data-scroll-lock-locked') !== 'true') {
      var computedStyle = window.getComputedStyle($target);
      $target.setAttribute('data-scroll-lock-saved-overflow-y-property', computedStyle.overflowY);
      $target.setAttribute('data-scroll-lock-saved-inline-overflow-property', $target.style.overflow);
      $target.setAttribute('data-scroll-lock-saved-inline-overflow-y-property', $target.style.overflowY);
      $target.style.overflow = 'hidden';
      $target.setAttribute('data-scroll-lock-locked', 'true');
    }
  };

  var scroll_lock_showLockableOverflowTarget = function showLockableOverflowTarget($target) {
    if (isElement($target) && $target.getAttribute('data-scroll-lock-locked') === 'true') {
      $target.style.overflow = $target.getAttribute('data-scroll-lock-saved-inline-overflow-property');
      $target.style.overflowY = $target.getAttribute('data-scroll-lock-saved-inline-overflow-y-property');
      $target.removeAttribute('data-scroll-lock-saved-overflow-property');
      $target.removeAttribute('data-scroll-lock-saved-inline-overflow-property');
      $target.removeAttribute('data-scroll-lock-saved-inline-overflow-y-property');
      $target.removeAttribute('data-scroll-lock-locked');
    }
  };

  var fillGaps = function fillGaps() {
    state.fillGapSelectors.map(function (selector) {
      scroll_lock_fillGapSelector(selector);
    });
  };

  var unfillGaps = function unfillGaps() {
    state.fillGapSelectors.map(function (selector) {
      scroll_lock_unfillGapSelector(selector);
    });
  };

  var scroll_lock_fillGapSelector = function fillGapSelector(selector) {
    var $targets = document.querySelectorAll(selector);
    var isLockable = state.lockableSelectors.indexOf(selector) !== -1;
    eachNode($targets, function ($target) {
      scroll_lock_fillGapTarget($target, isLockable);
    });
  };

  var scroll_lock_fillGapTarget = function fillGapTarget($target) {
    var isLockable = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    if (isElement($target)) {
      var scrollBarWidth;

      if ($target.getAttribute('data-scroll-lock-lockable') === '' || isLockable) {
        scrollBarWidth = scroll_lock_getTargetScrollBarWidth($target, true);
      } else {
        var $lockableParent = findParentBySelector($target, arrayAsSelector(state.lockableSelectors));
        scrollBarWidth = scroll_lock_getTargetScrollBarWidth($lockableParent, true);
      }

      if ($target.getAttribute('data-scroll-lock-filled-gap') === 'true') {
        scroll_lock_unfillGapTarget($target);
      }

      var computedStyle = window.getComputedStyle($target);
      $target.setAttribute('data-scroll-lock-filled-gap', 'true');
      $target.setAttribute('data-scroll-lock-current-fill-gap-method', state.fillGapMethod);

      if (state.fillGapMethod === 'margin') {
        var currentMargin = parseFloat(computedStyle.marginRight);
        $target.style.marginRight = "".concat(currentMargin + scrollBarWidth, "px");
      } else if (state.fillGapMethod === 'width') {
        $target.style.width = "calc(100% - ".concat(scrollBarWidth, "px)");
      } else if (state.fillGapMethod === 'max-width') {
        $target.style.maxWidth = "calc(100% - ".concat(scrollBarWidth, "px)");
      } else if (state.fillGapMethod === 'padding') {
        var currentPadding = parseFloat(computedStyle.paddingRight);
        $target.style.paddingRight = "".concat(currentPadding + scrollBarWidth, "px");
      }
    }
  };

  var scroll_lock_unfillGapSelector = function unfillGapSelector(selector) {
    var $targets = document.querySelectorAll(selector);
    eachNode($targets, function ($target) {
      scroll_lock_unfillGapTarget($target);
    });
  };

  var scroll_lock_unfillGapTarget = function unfillGapTarget($target) {
    if (isElement($target)) {
      if ($target.getAttribute('data-scroll-lock-filled-gap') === 'true') {
        var currentFillGapMethod = $target.getAttribute('data-scroll-lock-current-fill-gap-method');
        $target.removeAttribute('data-scroll-lock-filled-gap');
        $target.removeAttribute('data-scroll-lock-current-fill-gap-method');

        if (currentFillGapMethod === 'margin') {
          $target.style.marginRight = "";
        } else if (currentFillGapMethod === 'width') {
          $target.style.width = "";
        } else if (currentFillGapMethod === 'max-width') {
          $target.style.maxWidth = "";
        } else if (currentFillGapMethod === 'padding') {
          $target.style.paddingRight = "";
        }
      }
    }
  };

  var onResize = function onResize(e) {
    refillGaps();
  };

  var onTouchStart = function onTouchStart(e) {
    if (!state.scroll) {
      state.startTouchY = e.touches[0].clientY;
      state.startTouchX = e.touches[0].clientX;
    }
  };

  var scroll_lock_onTouchMove = function onTouchMove(e) {
    if (!state.scroll) {
      var startTouchY = state.startTouchY,
          startTouchX = state.startTouchX;
      var currentClientY = e.touches[0].clientY;
      var currentClientX = e.touches[0].clientX;

      if (e.touches.length < 2) {
        var selector = arrayAsSelector(state.scrollableSelectors);
        var direction = {
          up: startTouchY < currentClientY,
          down: startTouchY > currentClientY,
          left: startTouchX < currentClientX,
          right: startTouchX > currentClientX
        };
        var directionWithOffset = {
          up: startTouchY + TOUCH_DIRECTION_DETECT_OFFSET < currentClientY,
          down: startTouchY - TOUCH_DIRECTION_DETECT_OFFSET > currentClientY,
          left: startTouchX + TOUCH_DIRECTION_DETECT_OFFSET < currentClientX,
          right: startTouchX - TOUCH_DIRECTION_DETECT_OFFSET > currentClientX
        };

        var handle = function handle($el) {
          var skip = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

          if ($el) {
            var parentScrollableEl = findParentBySelector($el, selector, false);

            if (elementIsInputRange($el)) {
              return false;
            }

            if (skip || elementIsScrollableField($el) && findParentBySelector($el, selector) || elementHasSelector($el, selector)) {
              var prevent = false;

              if (elementScrollLeftOnStart($el) && elementScrollLeftOnEnd($el)) {
                if (direction.up && elementScrollTopOnStart($el) || direction.down && elementScrollTopOnEnd($el)) {
                  prevent = true;
                }
              } else if (elementScrollTopOnStart($el) && elementScrollTopOnEnd($el)) {
                if (direction.left && elementScrollLeftOnStart($el) || direction.right && elementScrollLeftOnEnd($el)) {
                  prevent = true;
                }
              } else if (directionWithOffset.up && elementScrollTopOnStart($el) || directionWithOffset.down && elementScrollTopOnEnd($el) || directionWithOffset.left && elementScrollLeftOnStart($el) || directionWithOffset.right && elementScrollLeftOnEnd($el)) {
                prevent = true;
              }

              if (prevent) {
                if (parentScrollableEl) {
                  handle(parentScrollableEl, true);
                } else {
                  if (e.cancelable) {
                    e.preventDefault();
                  }
                }
              }
            } else {
              handle(parentScrollableEl);
            }
          } else {
            if (e.cancelable) {
              e.preventDefault();
            }
          }
        };

        handle(e.target);
      }
    }
  };

  var onTouchEnd = function onTouchEnd(e) {
    if (!state.scroll) {
      state.startTouchY = 0;
      state.startTouchX = 0;
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', onResize);
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('touchstart', onTouchStart);
    document.addEventListener('touchmove', scroll_lock_onTouchMove, {
      passive: false
    });
    document.addEventListener('touchend', onTouchEnd);
  }

  var deprecatedMethods = {
    hide: function hide(target) {
      throwError('"hide" is deprecated! Use "disablePageScroll" instead. \n https://github.com/FL3NKEY/scroll-lock#disablepagescrollscrollabletarget');
      disablePageScroll(target);
    },
    show: function show(target) {
      throwError('"show" is deprecated! Use "enablePageScroll" instead. \n https://github.com/FL3NKEY/scroll-lock#enablepagescrollscrollabletarget');
      enablePageScroll(target);
    },
    toggle: function toggle(target) {
      throwError('"toggle" is deprecated! Do not use it.');

      if (getScrollState()) {
        disablePageScroll();
      } else {
        enablePageScroll(target);
      }
    },
    getState: function getState() {
      throwError('"getState" is deprecated! Use "getScrollState" instead. \n https://github.com/FL3NKEY/scroll-lock#getscrollstate');
      return getScrollState();
    },
    getWidth: function getWidth() {
      throwError('"getWidth" is deprecated! Use "getPageScrollBarWidth" instead. \n https://github.com/FL3NKEY/scroll-lock#getpagescrollbarwidth');
      return getPageScrollBarWidth();
    },
    getCurrentWidth: function getCurrentWidth() {
      throwError('"getCurrentWidth" is deprecated! Use "getCurrentPageScrollBarWidth" instead. \n https://github.com/FL3NKEY/scroll-lock#getcurrentpagescrollbarwidth');
      return getCurrentPageScrollBarWidth();
    },
    setScrollableTargets: function setScrollableTargets(target) {
      throwError('"setScrollableTargets" is deprecated! Use "addScrollableTarget" instead. \n https://github.com/FL3NKEY/scroll-lock#addscrollabletargetscrollabletarget');
      scroll_lock_addScrollableTarget(target);
    },
    setFillGapSelectors: function setFillGapSelectors(selector) {
      throwError('"setFillGapSelectors" is deprecated! Use "addFillGapSelector" instead. \n https://github.com/FL3NKEY/scroll-lock#addfillgapselectorfillgapselector');
      scroll_lock_addFillGapSelector(selector);
    },
    setFillGapTargets: function setFillGapTargets(target) {
      throwError('"setFillGapTargets" is deprecated! Use "addFillGapTarget" instead. \n https://github.com/FL3NKEY/scroll-lock#addfillgaptargetfillgaptarget');
      scroll_lock_addFillGapTarget(target);
    },
    clearQueue: function clearQueue() {
      throwError('"clearQueue" is deprecated! Use "clearQueueScrollLocks" instead. \n https://github.com/FL3NKEY/scroll-lock#clearqueuescrolllocks');
      clearQueueScrollLocks();
    }
  };

  var scrollLock = _objectSpread({
    disablePageScroll: disablePageScroll,
    enablePageScroll: enablePageScroll,
    getScrollState: getScrollState,
    clearQueueScrollLocks: clearQueueScrollLocks,
    getTargetScrollBarWidth: scroll_lock_getTargetScrollBarWidth,
    getCurrentTargetScrollBarWidth: scroll_lock_getCurrentTargetScrollBarWidth,
    getPageScrollBarWidth: getPageScrollBarWidth,
    getCurrentPageScrollBarWidth: getCurrentPageScrollBarWidth,
    addScrollableSelector: scroll_lock_addScrollableSelector,
    removeScrollableSelector: scroll_lock_removeScrollableSelector,
    addScrollableTarget: scroll_lock_addScrollableTarget,
    removeScrollableTarget: scroll_lock_removeScrollableTarget,
    addLockableSelector: scroll_lock_addLockableSelector,
    addLockableTarget: scroll_lock_addLockableTarget,
    addFillGapSelector: scroll_lock_addFillGapSelector,
    removeFillGapSelector: scroll_lock_removeFillGapSelector,
    addFillGapTarget: scroll_lock_addFillGapTarget,
    removeFillGapTarget: scroll_lock_removeFillGapTarget,
    setFillGapMethod: scroll_lock_setFillGapMethod,
    refillGaps: refillGaps,
    _state: state
  }, deprecatedMethods);

  /* harmony default export */ var scroll_lock = __webpack_exports__["default"] = (scrollLock);

  /***/ })
  /******/ ])["default"];
  });
  });

  var scrollLock$1 = /*@__PURE__*/getDefaultExportFromCjs(scrollLock);

  var scrollLock$2 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.assign(/*#__PURE__*/Object.create(null), scrollLock, {
    'default': scrollLock$1
  }));

  exports.AOS = aos$1;
  exports.Flickity = js;
  exports.FlickityAsNavFor = asNavFor;
  exports.FlickityFade = flickityFade;
  exports.FlickityImagesLoaded = flickityImagesloaded;
  exports.ScrollLock = scrollLock$2;
  exports.Sqrl = squirrelly_min$2;
  exports.ajaxinate = Ajaxinate;
  exports.themeAddresses = themeAddresses;
  exports.themeCurrency = currency;
  exports.themeImages = images;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

}({}));
//# sourceMappingURL=vendor.js.map
