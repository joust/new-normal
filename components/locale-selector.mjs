import { BaseComponent } from './base-component.mjs'

export class LocaleSelector extends BaseComponent {
  static observedAttributes = ['languages']

  get languages () {
    return (this.getAttribute('languages') || 'en,de,es').split(',')
  }

  get value () {
    return this.shadowRoot ? this.element('locale').value : this._pendingValue || ''
  }

  set value (v) {
    if (this.shadowRoot) this.element('locale').value = v
    else this._pendingValue = v
  }

  get html () {
    return `
      <slot></slot>
      <select part="select" id="locale">
        <optgroup label="🌍 Africa">
          <option title="Angola" value="pt-ao">🇦🇴 Angola</option>
          <option title="Benin" value="fr-bj">🇧🇯 Bénin</option>
          <option title="Burkina Faso" value="fr-bf">🇧🇫 Burkina Faso</option>
          <option title="Cameroon" value="en-cm">🇨🇲 Cameroon</option>
          <option title="Cameroun" value="fr-cm">🇨🇲 Cameroun</option>
          <option title="Cabo Verde" value="pt-cv">🇨🇻 Cabo Verde</option>
          <option title="Congo" value="fr-cg">🇨🇬 Congo</option>
          <option title="Congo" value="fr-cd">🇨🇩 Congo</option>
          <option title="Côte d'Ivoire" value="fr-ci">🇨🇮 Côte d'Ivoire</option>
          <option title="Guinea Ecuatorial" value="es-gq">🇬🇶 Guinea Ecuatorial</option>
          <option title="Guiné-Bissau" value="pt-gw">🇬🇼 Guiné-Bissau</option>
          <option title="Madagascar" value="fr-mg">🇲🇬 Madagascar</option>
          <option title="Mali" value="fr-ml">🇲🇱 Mali</option>
          <option title="Moçambique" value="pt-mz">🇲🇿 Moçambique</option>
          <option title="Niger" value="fr-ne">🇳🇪 Niger</option>
          <option title="São Tomé & Príncipe" value="pt-st">🇸🇹 São Tomé & Príncipe</option>
          <option title="Sénégal" value="fr-sn">🇸🇳 Sénégal</option>
        </optgroup>

        <optgroup label="🇪🇺 Europe">
          <option title="Österreich" value="de-at">🇦🇹 Österreich</option>
          <option title="België" value="nl-be">🇧🇪 België</option>
          <option title="Belgique" value="fr-be">🇧🇪 Belgique</option>
          <option title="Belgien" value="de-be">🇧🇪 Belgien</option>
          <option title="Danmark" value="da-dk">🇩🇰 Danmark</option>
          <option title="France" value="fr-fr">🇫🇷 France</option>
          <option title="Deutschland" value="de-de">🇩🇪 Deutschland</option>
          <option title="Ireland" value="en-ie">🇮🇪 Ireland</option>
          <option title="Italia" value="it-it">🇮🇹 Italia</option>
          <option title="Italien" value="de-it">🇮🇹 Italien</option>
          <option title="Liechtenstein" value="de-li">🇱🇮 Liechtenstein</option>
          <option title="Malta" value="en-mt">🇲🇹 Malta</option>
          <option title="Nederland" value="nl-nl">🇳🇱 Nederland</option>
          <option title="Polska" value="pl-pl">🇵🇱 Polska</option>
          <option title="Portugal" value="pt-pt">🇵🇹 Portugal</option>
          <option title="San Marino" value="it-sm">🇸🇲 San Marino</option>
          <option title="España" value="es-es">🇪🇸 España</option>
          <option title="Schweiz" value="de-ch">🇨🇭 Schweiz</option>
          <option title="Suisse" value="fr-ch">🇨🇭 Suisse</option>
          <option title="Svizzera" value="it-ch">🇨🇭 Svizzera</option>
          <option title="United Kingdom" value="en-gb">🇬🇧 United Kingdom</option>
          <option title="Città del Vaticano" value="it-va">🇻🇦 Città del Vaticano</option>
        </optgroup>

        <optgroup label="🌎 North America">
          <option title="Canada" value="en-ca">🇨🇦 Canada</option>
          <option title="Canada" value="fr-ca">🇨🇦 Canada (Français)</option>
          <option title="Costa Rica" value="es-cr">🇨🇷 Costa Rica</option>
          <option title="Cuba" value="es-cu">🇨🇺 Cuba</option>
          <option title="República Dominicana" value="es-do">🇩🇴 República Dominicana</option>
          <option title="El Salvador" value="es-sv">🇸🇻 El Salvador</option>
          <option title="Guatemala" value="es-gt">🇬🇹 Guatemala</option>
          <option title="Haïti" value="fr-ht">🇭🇹 Haïti</option>
          <option title="Honduras" value="es-hn">🇭🇳 Honduras</option>
          <option title="México" value="es-mx">🇲🇽 México</option>
          <option title="Nicaragua" value="es-ni">🇳🇮 Nicaragua</option>
          <option title="Panamá" value="es-pa">🇵🇦 Panamá</option>
          <option title="United States" value="en-us">🇺🇸 United States</option>
        </optgroup>

        <optgroup label="🌎 South America">
          <option title="Argentina" value="es-ar">🇦🇷 Argentina</option>
          <option title="Bolivia" value="es-bo">🇧🇴 Bolivia</option>
          <option title="Brasil" value="pt-br">🇧🇷 Brasil</option>
          <option title="Chile" value="es-cl">🇨🇱 Chile</option>
          <option title="Colombia" value="es-co">🇨🇴 Colombia</option>
          <option title="Ecuador" value="es-ec">🇪🇨 Ecuador</option>
          <option title="Guyana" value="en-gy">🇬🇾 Guyana</option>
          <option title="Paraguay" value="es-py">🇵🇾 Paraguay</option>
          <option title="Perú" value="es-pe">🇵🇪 Perú</option>
          <option title="Uruguay" value="es-uy">🇺🇾 Uruguay</option>
          <option title="Venezuela" value="es-ve">🇻🇪 Venezuela</option>
        </optgroup>

        <optgroup label="🌏 Oceania">
          <option title="Australia" value="en-au">🇦🇺 Australia</option>
          <option title="New Zealand" value="en-nz">🇳🇿 New Zealand</option>
        </optgroup>

        <optgroup label="🏝️ Caribbean">
          <option title="Antigua and Barbuda" value="en-ag">🇦🇬 Antigua and Barbuda</option>
          <option title="The Bahamas" value="en-bs">🇧🇸 The Bahamas</option>
          <option title="Barbados" value="en-bb">🇧🇧 Barbados</option>
          <option title="Belize" value="en-bz">🇧🇿 Belize</option>
          <option title="Dominica" value="en-dm">🇩🇲 Dominica</option>
          <option title="Grenada" value="en-gd">🇬🇩 Grenada</option>
          <option title="Jamaica" value="en-jm">🇯🇲 Jamaica</option>
          <option title="Puerto Rico" value="es-pr">🇵🇷 Puerto Rico</option>
          <option title="St Kitts and Nevis" value="en-kn">🇰🇳 St Kitts and Nevis</option>
          <option title="St Lucia" value="en-lc">🇱🇨 St Lucia</option>
          <option title="St Vincent and the Grenadines" value="en-vc">🇻🇨 St Vincent and the Grenadines</option>
          <option title="Trinidad and Tobago" value="en-tt">🇹🇹 Trinidad and Tobago</option>
        </optgroup>
      </select>`
  }

  get css () {
    return `
      :host {
        display: inline-block;
        overflow: hidden;
      }

      select {
        width: 100%;
        height: 100%;
        font-size: inherit;
        background: transparent;
        padding: 0;
        border: none;
        outline: none;
        color: inherit;
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
      }

      option {
        font-family: 'Open Sans', Helvetica, sans-serif;
      }
    `
  }

  connectedCallback () {
    super.connectedCallback()
    if (this._pendingValue) {
      this.element('locale').value = this._pendingValue
      this._pendingValue = null
    }
    this.element('locale').addEventListener('change', e => {
      this.dispatchEvent(new CustomEvent('locale-change', {
        bubbles: true, composed: true,
        detail: { locale: e.target.value }
      }))
    })
    this.update()
  }

  attributeChangedCallback () {
    this.update()
  }

  update () {
    if (this.shadowRoot) {
      Array.from(this.element('locale').options).forEach(option => {
        const language = option.value.split('-')[0]
        option.hidden = !this.languages.includes(language)
      })
    }
  }
}
