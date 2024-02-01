document.querySelectorAll('template[wc-name]').forEach(template => {
  const __name = template.getAttribute('wc-name');
  const __attrs = template.getAttributeNames();
  const __script = template.content.querySelector('script');
  
  template.content.querySelectorAll('script').forEach(el => el.remove());
  const __interpolations = Array.from(new Set(template.innerHTML.match(/[^{{}}]+(?=}})/gm)));

  window.customElements.define(__name, class extends HTMLElement {
    $initialized = false;
    props = {};

    constructor() {
      super();
      this.props = this._props();
    }
    
    static get observedAttributes() {
      return __attrs;
    }

    attributeChangedCallback() {
      this.props = this._props();
    }

    _props() {
      const props = __attrs.reduce((attrs, item) => {
        if (!item.startsWith('wc-')) {
          attrs[item] = this.getAttribute(item);
        }

        return attrs;
      }, {});

      return Object.freeze(props);
    }

    _content(interpolations = {}) {
      let innerHTML = template.innerHTML;

      Object.entries(interpolations).forEach(item => {
        innerHTML = innerHTML.replaceAll(`{{${item[0]}}}`, item[1]);
      });

      return Object.assign(document.createElement('template'), { innerHTML }).content;
    }

    _render() {
      return new Function(`
          ${__script.textContent}
          var $i = {};

          ${__interpolations.map(item => {
            return `$i["${item}"] = ${item}`;
          })}

          return this._content($i);
      `).bind(this)();
    }

    connectedCallback() {
      /*
        * The constructor for a custom element is not supposed to read or write its DOM. 
        * It shouldn't create child elements or modify attributes. That work needs to be 
        * done later, usually in a connectedCallback() method (although note that connectedCallback() 
        * can be called multiple times if the element is removed and re-added to the DOM, 
        * so you may need to check for this, or undo changes in a disconnectedCallback()).
        * SPEC: https://html.spec.whatwg.org/multipage/custom-elements.html#custom-element-conformance
        */
      !this.$initialized && this.init();
    }

    init() {  
      this.$initialized = true;
      this.append(this._render());
    }

    disconnectedCallback() {
      // 
    }      
  }); 
});
