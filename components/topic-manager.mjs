class TopicManager extends HTMLElement {
  constructor() {
    super();
    this.topics = new Map();
    this.idiotArguments = new Set();
    this.sheepArguments = new Set();
    this.currentTopicId = null;
    this.attachShadow({ mode: 'open' });

    // Initialize data structures
    this.topics = new Map();
    this.idiotArguments = new Set();
    this.sheepArguments = new Set();

    // Set up the template
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
          height: 100vh;
          padding: 1rem;
          gap: 1rem;
        }
        * {
          box-sizing: border-box;
        }
        h2 {
          font-size: 1.25rem;
          margin: 0 0 1rem 0;
        }
        input[type="text"] {
          padding: 0.5rem;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          font: inherit;
        }
        .json-controls {
          display: flex;
          gap: 0.5rem;
        }
        .container {
          display: grid;
          grid-template-columns: minmax(300px, 2fr) 3fr 3fr;
          gap: 2rem;
          flex: 1;
          min-height: 0;
        }
        .topic-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          height: 100%;
          overflow: hidden;
        }
        .topic-section #topicsList {
          flex: 1;
          overflow-y: auto;
        }
        .arguments-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          grid-column: 2 / -1;
        }
        .idiot-arguments,
        .sheep-arguments {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          height: 100%;
          overflow: hidden;
        }
        .scrollable-area {
          flex: 1;
          overflow-y: auto;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          padding: 1rem;
          background: white;
        }
        .toolbar {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .toolbar input[type="text"] {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          font-family: inherit;
        }
        .toolbar textarea {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          font-family: inherit;
          min-height: 60px;
          resize: vertical;
        }
        .toolbar button {
          align-self: flex-start;
          background: #007bff;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-family: inherit;
        }
        .toolbar button:hover {
          background: #0056b3;
        }
        .argument {
          background: #e9ecef;
          padding: 0.5rem;
          margin: 0.5rem 0;
          border-radius: 4px;
          cursor: move;
          display: flex;
          flex-direction: column;
        }
        .argument h4 {
          margin: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .argument-details {
          margin-top: 0.5rem;
          color: #666;
          cursor: text;
          flex: 1;
        }
        .argument-details-input {
          width: 100%;
          margin-top: 0.5rem;
          padding: 0.5rem;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          font-family: inherit;
          min-height: 80px;
          resize: vertical;
          background: white;
          flex: 1;
        }
        .argument.assigned {
          opacity: 0.6;
          background: #dee2e6;
        }
        .argument.assigned:hover {
          opacity: 0.8;
        }
        .argument.dragging {
          opacity: 0.5;
        }
        .argument-controls {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        .topic-badges {
          display: flex;
          gap: 0.3rem;
          align-items: center;
        }
        .topic-badge {
          font-size: 0.8em;
          background: #6c757d;
          color: white;
          padding: 0.2rem 0.4rem;
          border-radius: 3px;
          font-family: monospace;
          white-space: nowrap;
        }
        .delete-btn {
          color: white;
          border: none;
          width: 24px;
          height: 24px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 14px;
          padding: 0;
          margin: 0;
        }
        .delete-btn.remove {
          background: #6c757d;
        }
        .delete-btn.remove:hover {
          background: #5a6268;
        }
        .delete-btn.delete {
          background: #dc3545;
        }
        .delete-btn.delete:hover {
          background: #c82333;
        }
        .argument-id {
          font-family: monospace;
          padding: 0.2rem 0.4rem;
          border-radius: 3px;
          margin-right: 0.5rem;
          font-size: 0.9em;
          background: #f8f9fa;
        }
        .argument.idiot .argument-id,
        .topic-argument .argument-id.idiot {
          color: #dc3545;
          border: 1px solid #dc3545;
        }
        .argument.sheep .argument-id,
        .topic-argument .argument-id.sheep {
          color: #007bff;
          border: 1px solid #007bff;
        }
        .add-button {
          width: 32px;
          height: 32px;
          border-radius: 16px;
          background: #28a745;
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          padding: 0;
          transition: background-color 0.2s, transform 0.2s;
        }
        .add-button::before {
          content: "+";
        }
        .add-button:hover {
          background: #218838;
          transform: scale(1.05);
        }
        .topic {
          background: white;
          margin: 0.5rem;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12);
          position: relative;
          transition: border-color 0.2s ease;
        }
        .topic.drag-over {
          border: 2px dashed #007bff;
          background: #f8f9fa;
        }
        .topic.drag-over .topic-header {
          background: #e9ecef;
        }
        .topic-header {
          padding: 1rem;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
        }
        .topic-header-main {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
        }
        .topic-id {
          font-family: monospace;
          padding: 0.2rem 0.4rem;
          border-radius: 3px;
          background: #f8f9fa;
          font-size: 0.9em;
          color: #495057;
          border: 1px solid #dee2e6;
          order: -1;
        }
        .topic-header:hover {
          background: #e9ecef;
        }
        .topic-title {
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .topic-title:hover {
          color: #007bff;
        }
        .topic-title-input {
          font: inherit;
          padding: 0.2rem 0.5rem;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          width: 100%;
        }
        .topic-toggle {
          display: inline-block;
          width: 20px;
          height: 20px;
          text-align: center;
          line-height: 20px;
        }
        .topic-toggle::before {
          content: '▼';
          font-size: 12px;
        }
        .topic.closed .topic-toggle::before {
          content: '▶';
        }
        .topic-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
        }
        .topic.closed .topic-content {
          display: none;
        }
        .topic-side {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 4px;
        }
        .topic-side.idiot {
          border-left: 3px solid #dc3545;
        }
        .topic-side.sheep {
          border-left: 3px solid #007bff;
        }
        .topic-side h4 {
          margin: 0 0 0.5rem 0;
          color: #666;
        }
        .topic-arguments {
          margin-top: 1rem;
          min-height: 50px;
          background: white;
          border-radius: 4px;
          padding: 0.5rem;
        }
        .topic-arguments.drag-over {
          background: #e9ecef;
          border: 2px dashed #007bff;
        }
        .topic-argument {
          background: #f8f9fa;
          padding: 0.5rem;
          margin: 0.5rem 0;
          border-radius: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .topic-id {
          font-size: 0.8em;
          color: #666;
          background: #dee2e6;
          padding: 0.2rem 0.4rem;
          border-radius: 3px;
          font-family: monospace;
        }
        .summary {
          width: 100%;
          min-height: 80px;
          padding: 0.5rem;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          margin: 0.5rem 0;
          font-family: inherit;
          resize: vertical;
        }
        .topic-compact-args {
          display: none;
          font-size: 0.9em;
          font-family: monospace;
          padding-left: 1.5rem;
        }
        .topic.closed .topic-compact-args {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .compact-arg {
          padding: 0.2rem 0.4rem;
          border-radius: 3px;
          background: #f1f3f5;
          color: #666;
        }
        .compact-arg.idiot {
          color: #dc3545;
          border: 1px solid #dc3545;
        }
        .compact-arg.sheep {
          color: #007bff;
          border: 1px solid #007bff;
        }
        .section-header {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          margin-bottom: 1rem;
        }
        .section-header h2 {
          margin: 0;
          flex: 1;
        }
        .section-header input {
          flex: 1;
        }
        .dialog-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .dialog {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          max-width: 400px;
          width: 90%;
        }
        .dialog h3 {
          margin: 0 0 1rem 0;
        }
        .dialog-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .dialog-form input,
        .dialog-form textarea {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          font-family: inherit;
        }
        .dialog-form textarea {
          min-height: 100px;
          resize: vertical;
        }
        .dialog-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
        }
        .dialog-buttons button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .dialog-buttons .secondary {
          background: #6c757d;
          color: white;
        }
        .dialog-buttons .primary {
          background: #007bff;
          color: white;
        }
        .dialog-buttons .primary.delete {
          background: #dc3545;
        }
        .dialog-buttons .primary.delete:hover {
          background: #c82333;
        }
        .json-controls {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .json-button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9em;
          color: white;
          transition: background-color 0.2s;
        }
        .json-button.import {
          background: #007bff;
        }
        .json-button.import:hover {
          background: #0056b3;
        }
        .json-button.export {
          background: #28a745;
        }
        .json-button.export:hover {
          background: #218838;
        }
      </style>
      <div class="json-controls">
        <input type="file" id="jsonFileInput" accept=".json" style="display: none;">
        <button class="json-button import" id="importButton">📥 Import JSON</button>
        <button class="json-button export" id="exportButton">📤 Export JSON</button>
      </div>
      <div class="container">
        <div class="topic-section">
          <div class="section-header">
            <h2>Topics</h2>
            <input type="text" id="topicInput" placeholder="New topic title">
            <button class="add-button" id="addTopicButton"></button>
          </div>
          <div id="topicsList"></div>
        </div>
        <div class="arguments-section">
          <div class="idiot-arguments">
            <div class="section-header">
              <h2>Idiot Arguments</h2>
              <button class="add-button" id="addIdiotButton"></button>
            </div>
            <div class="scrollable-area">
              <div id="idiotArgumentList"></div>
            </div>
          </div>
          <div class="sheep-arguments">
            <div class="section-header">
              <h2>Sheep Arguments</h2>
              <button class="add-button" id="addSheepButton"></button>
            </div>
            <div class="scrollable-area">
              <div id="sheepArgumentList"></div>
            </div>
          </div>
        </div>
      </div>

      <div id="idiotDialog" class="dialog-backdrop" style="display: none;">
        <div class="dialog">
          <h3 id="idiotDialogTitle">Add Idiot Argument</h3>
          <div class="dialog-form">
            <input type="text" id="idiotTitle" placeholder="Argument Title">
            <textarea id="idiotDetails" placeholder="Argument Details (optional)"></textarea>
            <div class="dialog-buttons">
              <button class="secondary" id="cancelIdiotDialog">Cancel</button>
              <button class="primary" id="submitIdiotDialog">Add</button>
            </div>
          </div>
        </div>
      </div>

      <div id="sheepDialog" class="dialog-backdrop" style="display: none;">
        <div class="dialog">
          <h3 id="sheepDialogTitle">Add Sheep Argument</h3>
          <div class="dialog-form">
            <input type="text" id="sheepTitle" placeholder="Argument Title">
            <textarea id="sheepDetails" placeholder="Argument Details (optional)"></textarea>
            <div class="dialog-buttons">
              <button class="secondary" id="cancelSheepDialog">Cancel</button>
              <button class="primary" id="submitSheepDialog">Add</button>
            </div>
          </div>
        </div>
      </div>

      <div id="confirmDialog" class="dialog-backdrop" style="display: none;">
        <div class="dialog">
          <h3>Confirm Delete</h3>
          <div class="dialog-form">
            <p id="confirmMessage"></p>
            <div class="dialog-buttons">
              <button class="secondary" id="cancelConfirmDialog">Cancel</button>
              <button class="primary delete" id="confirmDeleteButton">Delete</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.connectedCallback();
  }

  connectedCallback() {
    const template = document.createElement('template');
    template.innerHTML = this.shadowRoot.innerHTML;
    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // Add argument buttons
    const addIdiotBtn = this.shadowRoot.getElementById('addIdiotButton');
    const addSheepBtn = this.shadowRoot.getElementById('addSheepButton');
    
    addIdiotBtn.addEventListener('click', () => this.showIdiotDialog());
    addSheepBtn.addEventListener('click', () => this.showSheepDialog());

    // Dialog buttons
    const submitIdiotBtn = this.shadowRoot.getElementById('submitIdiotDialog');
    const cancelIdiotBtn = this.shadowRoot.getElementById('cancelIdiotDialog');
    const submitSheepBtn = this.shadowRoot.getElementById('submitSheepDialog');
    const cancelSheepBtn = this.shadowRoot.getElementById('cancelSheepDialog');

    submitIdiotBtn.addEventListener('click', () => this.submitIdiotDialog());
    cancelIdiotBtn.addEventListener('click', () => this.hideDialog('idiotDialog'));
    submitSheepBtn.addEventListener('click', () => this.submitSheepDialog());
    cancelSheepBtn.addEventListener('click', () => this.hideDialog('sheepDialog'));

    // Clear form on dialog close
    const idiotDialog = this.shadowRoot.getElementById('idiotDialog');
    const sheepDialog = this.shadowRoot.getElementById('sheepDialog');

    idiotDialog.addEventListener('click', (e) => {
      if (e.target === idiotDialog) {
        this.hideDialog('idiotDialog');
      }
    });

    sheepDialog.addEventListener('click', (e) => {
      if (e.target === sheepDialog) {
        this.hideDialog('sheepDialog');
      }
    });

    // Reset form on dialog close
    const resetForm = (type) => {
      const title = this.shadowRoot.getElementById(`${type}Title`);
      const details = this.shadowRoot.getElementById(`${type}Details`);
      title.value = '';
      details.value = '';
    };

    ['idiot', 'sheep'].forEach(type => {
      this.shadowRoot.getElementById(`${type}Dialog`).addEventListener('click', (e) => {
        if (e.target === this.shadowRoot.getElementById(`${type}Dialog`)) {
          resetForm(type);
        }
      });
    });

    // Initial render
    this.renderTopics();
    this.renderArguments('idiot');
    this.renderArguments('sheep');

    // Add topic button handler
    const addTopicBtn = this.shadowRoot.getElementById('addTopicButton');
    addTopicBtn.addEventListener('click', () => this.addTopic());

    // Add topic input handler
    const topicInput = this.shadowRoot.getElementById('topicInput');
    topicInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addTopic();
      }
    });

    // Setup JSON import/export
    const importButton = this.shadowRoot.getElementById('importButton');
    const exportButton = this.shadowRoot.getElementById('exportButton');
    const fileInput = this.shadowRoot.getElementById('jsonFileInput');

    importButton.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            this.loadFromJson(data);
          } catch (error) {
            console.error('Error loading JSON:', error);
            alert('Invalid JSON file format');
          }
        };
        reader.readAsText(file);
      }
    });

    exportButton.addEventListener('click', () => {
      this.exportToJson();
    });
  }

  addDragListeners(element) {
    element.addEventListener('dragstart', (e) => {
      this.draggedElement = element;
      element.classList.add('dragging');
    });

    element.addEventListener('dragend', () => {
      this.draggedElement = null;
      element.classList.remove('dragging');
    });
  }

  addDropZone(element, type) {
    element.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      element.classList.add('drag-over');
    });

    element.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      element.classList.remove('drag-over');
    });

    element.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      element.classList.remove('drag-over');
      
      const draggedId = this.draggedElement?.dataset.id;
      const draggedType = this.draggedElement?.dataset.type;
      const topicId = element.dataset.topicId;
      
      if (draggedId && draggedType === type && topicId) {
        this.assignArgumentToTopic(draggedId, topicId);
      }
    });
  }

  addTopicDropZone(element) {
    element.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      element.classList.add('drag-over');
    });

    element.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      element.classList.remove('drag-over');
    });

    element.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      element.classList.remove('drag-over');
      
      const draggedId = this.draggedElement?.dataset.id;
      const draggedType = this.draggedElement?.dataset.type;
      const topicId = element.dataset.id;
      
      if (draggedId && draggedType && topicId) {
        this.assignArgumentToTopic(draggedId, topicId);
      }
    });
  }

  getArgumentAssignments(argId) {
    const assignments = [];
    for (const [topicId, topic] of this.topics) {
      if (topic.arguments.has(argId)) {
        assignments.push({ id: topicId, title: topic.title });
      }
    }
    return assignments;
  }

  isArgumentAssigned(argId) {
    for (const [topicId, topic] of this.topics) {
      if (topic.arguments.has(argId)) {
        return { id: topicId, title: topic.title };
      }
    }
    return null;
  }

  renderArguments(type) {
    console.log('Rendering arguments:', type);
    const listElement = this.shadowRoot.getElementById(`${type}ArgumentList`);
    if (!listElement) {
      console.error('List element not found for type:', type);
      return;
    }

    listElement.innerHTML = '';
    const args = type === 'idiot' ? this.idiotArguments : this.sheepArguments;

    for (const arg of args) {
      console.log('Rendering argument:', arg);
      const argEl = document.createElement('div');
      argEl.className = `argument ${type}`;
      argEl.draggable = true;
      argEl.dataset.id = arg.id;
      argEl.dataset.type = type;

      argEl.innerHTML = `
        <h4>
          <span><span class="argument-id ${type}">${arg.id}</span> <span class="argument-title">${arg.title}</span></span>
          <div class="argument-controls">
            <span class="topic-badges"></span>
            <button class="delete-btn delete" title="Delete argument">&times;</button>
          </div>
        </h4>
        ${arg.details ? `<p class="argument-details">${arg.details}</p>` : ''}
      `;

      // Add click handler for title editing
      const titleSpan = argEl.querySelector('.argument-title');
      titleSpan.addEventListener('click', (e) => {
        e.stopPropagation();
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'argument-title-input';
        input.value = arg.title;
        titleSpan.replaceWith(input);
        input.focus();

        const saveTitle = () => {
          const newTitle = input.value.trim();
          if (newTitle && newTitle !== arg.title) {
            arg.title = newTitle;
            this.renderArguments(type);
          } else {
            input.replaceWith(titleSpan);
          }
        };

        input.addEventListener('blur', saveTitle);
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            saveTitle();
            input.blur();
          }
        });
      });

      // Add click handler for details editing
      const detailsP = argEl.querySelector('.argument-details');
      const addDetails = () => {
        const textarea = document.createElement('textarea');
        textarea.className = 'argument-details-input';
        textarea.value = arg.details || '';
        
        if (detailsP) {
          detailsP.replaceWith(textarea);
        } else {
          argEl.appendChild(textarea);
        }
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
        textarea.focus();

        const saveDetails = () => {
          const newDetails = textarea.value.trim();
          arg.details = newDetails;
          this.renderArguments(type);
        };

        textarea.addEventListener('blur', saveDetails);
        textarea.addEventListener('input', () => {
          textarea.style.height = 'auto';
          textarea.style.height = textarea.scrollHeight + 'px';
        });
      };

      if (detailsP) {
        detailsP.addEventListener('click', (e) => {
          e.stopPropagation();
          addDetails();
        });
      } else {
        // Add click area for adding details when none exist
        const addDetailsArea = document.createElement('p');
        addDetailsArea.className = 'argument-details';
        addDetailsArea.textContent = 'Click to add details...';
        addDetailsArea.style.opacity = '0.5';
        addDetailsArea.addEventListener('click', (e) => {
          e.stopPropagation();
          addDetails();
        });
        argEl.appendChild(addDetailsArea);
      }

      this.addDragListeners(argEl);

      const deleteBtn = argEl.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', () => {
        this.deleteArgument(arg.id, type);
      });

      listElement.appendChild(argEl);
      this.updateArgumentBadges(arg.id, argEl.querySelector('.topic-badges'));
    }
  }

  showEditDialog(argument) {
    const type = argument.type;
    const dialog = this.shadowRoot.getElementById(`${type}Dialog`);
    const titleInput = this.shadowRoot.getElementById(`${type}Title`);
    const detailsInput = this.shadowRoot.getElementById(`${type}Details`);
    const submitBtn = this.shadowRoot.getElementById(`submit${type.charAt(0).toUpperCase() + type.slice(1)}Dialog`);
    const dialogTitle = dialog.querySelector('h3');

    titleInput.value = argument.title;
    detailsInput.value = argument.details || '';

    // Store the argument being edited
    this._editingArgument = argument;

    // Update dialog and button text
    dialogTitle.textContent = `Edit ${type.charAt(0).toUpperCase() + type.slice(1)} Argument`;
    submitBtn.textContent = 'Update';

    dialog.style.display = 'flex';
  }

  submitIdiotDialog() {
    const title = this.shadowRoot.getElementById('idiotTitle').value.trim();
    const details = this.shadowRoot.getElementById('idiotDetails').value.trim();
    if (!title) return;

    if (this._editingArgument) {
      // Update existing argument
      this._editingArgument.title = title;
      this._editingArgument.details = details;
      this._editingArgument = null;
    } else {
      // Create new argument
      const argumentId = 'I' + (this.idiotArguments.size + 1);
      this.idiotArguments.add({
        id: argumentId,
        title,
        details,
        type: 'idiot'
      });
    }

    this.hideDialog('idiotDialog');
    this.shadowRoot.getElementById('idiotTitle').value = '';
    this.shadowRoot.getElementById('idiotDetails').value = '';
    this.shadowRoot.getElementById('submitIdiotDialog').textContent = 'Add';
    this.renderArguments('idiot');
  }

  submitSheepDialog() {
    const title = this.shadowRoot.getElementById('sheepTitle').value.trim();
    const details = this.shadowRoot.getElementById('sheepDetails').value.trim();
    if (!title) return;

    if (this._editingArgument) {
      // Update existing argument
      this._editingArgument.title = title;
      this._editingArgument.details = details;
      this._editingArgument = null;
    } else {
      // Create new argument
      const argumentId = 'S' + (this.sheepArguments.size + 1);
      this.sheepArguments.add({
        id: argumentId,
        title,
        details,
        type: 'sheep'
      });
    }

    this.hideDialog('sheepDialog');
    this.shadowRoot.getElementById('sheepTitle').value = '';
    this.shadowRoot.getElementById('sheepDetails').value = '';
    this.shadowRoot.getElementById('submitSheepDialog').textContent = 'Add';
    this.renderArguments('sheep');
  }

  hideDialog(dialogId) {
    const dialog = this.shadowRoot.getElementById(dialogId);
    dialog.style.display = 'none';
  }

  showIdiotDialog() {
    const dialog = this.shadowRoot.getElementById('idiotDialog');
    const titleInput = this.shadowRoot.getElementById('idiotTitle');
    const detailsInput = this.shadowRoot.getElementById('idiotDetails');
    
    // Reset form
    titleInput.value = '';
    detailsInput.value = '';
    
    dialog.style.display = 'flex';
    titleInput.focus();
  }

  showSheepDialog() {
    const dialog = this.shadowRoot.getElementById('sheepDialog');
    const titleInput = this.shadowRoot.getElementById('sheepTitle');
    const detailsInput = this.shadowRoot.getElementById('sheepDetails');
    
    // Reset form
    titleInput.value = '';
    detailsInput.value = '';
    
    dialog.style.display = 'flex';
    titleInput.focus();
  }

  renderTopics() {
    console.log('Rendering topics:', this.topics);
    const topicsList = this.shadowRoot.getElementById('topicsList');
    if (!topicsList) {
      console.error('Topics list element not found');
      return;
    }

    // Store current open state
    const openTopics = new Set(
      Array.from(topicsList.querySelectorAll('.topic'))
        .filter(t => !t.classList.contains('closed'))
        .map(t => t.dataset.id)
    );

    topicsList.innerHTML = '';

    for (const [id, topic] of this.topics) {
      console.log('Rendering topic:', id, topic);
      const topicEl = document.createElement('div');
      topicEl.className = 'topic';
      topicEl.dataset.id = id;
      
      // Restore open state
      if (!openTopics.has(id)) {
        topicEl.classList.add('closed');
      }

      // Add drop zone behavior to the entire topic element
      this.addTopicDropZone(topicEl);
      
      topicEl.innerHTML = `
        <div class="topic-header">
          <div class="topic-header-main">
            <span class="topic-id">${id}</span>
            <h3 class="topic-title">
              <span class="topic-toggle"></span>
              <span class="topic-text">${topic.title}</span>
            </h3>
            <button class="delete-topic-btn" title="Delete topic">&times;</button>
          </div>
          <div class="topic-compact-args">
            ${Array.from(topic.arguments).map(argId => {
              const type = argId.startsWith('I') ? 'idiot' : 'sheep';
              return `<span class="compact-arg ${type}">${argId}</span>`;
            }).join('')}
          </div>
        </div>
        <div class="topic-content">
          <div class="topic-side idiot">
            <h4>Idiot Summary</h4>
            <textarea class="summary idiot-summary" data-topic-id="${id}">${topic.idiotSummary || ''}</textarea>
            <div class="topic-arguments idiot-arguments" data-topic-id="${id}"></div>
          </div>
          <div class="topic-side sheep">
            <h4>Sheep Summary</h4>
            <textarea class="summary sheep-summary" data-topic-id="${id}">${topic.sheepSummary || ''}</textarea>
            <div class="topic-arguments sheep-arguments" data-topic-id="${id}"></div>
          </div>
        </div>
      `;

      // Add click handler for title editing
      const titleText = topicEl.querySelector('.topic-text');
      titleText.addEventListener('click', (e) => {
        e.stopPropagation();
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'topic-title-input';
        input.value = topic.title;
        titleText.replaceWith(input);
        input.focus();

        const saveTitle = () => {
          const newTitle = input.value.trim();
          if (newTitle && newTitle !== topic.title) {
            topic.title = newTitle;
            this.renderTopics();
          } else {
            input.replaceWith(titleText);
          }
        };

        input.addEventListener('blur', saveTitle);
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            saveTitle();
            input.blur();
          }
        });
      });

      // Add click handler for topic toggle
      const topicHeader = topicEl.querySelector('.topic-header');
      topicHeader.addEventListener('click', (e) => {
        // Don't toggle if clicking delete button or editing title
        if (e.target.closest('.delete-topic-btn') || e.target.closest('.topic-text')) {
          return;
        }
        topicEl.classList.toggle('closed');
      });

      // Add delete button handler
      const deleteBtn = topicEl.querySelector('.delete-topic-btn');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent topic toggle
        this.showConfirmDialog(
          `Are you sure you want to delete topic "${topic.title}"?`,
          () => {
            this.topics.delete(id);
            this.renderTopics();
          }
        );
      });

      // Add textarea change listeners
      const idiotSummary = topicEl.querySelector('.idiot-summary');
      const sheepSummary = topicEl.querySelector('.sheep-summary');

      idiotSummary.addEventListener('change', (e) => {
        topic.idiotSummary = e.target.value;
        this.dispatchEvent(new CustomEvent('summary-changed', {
          detail: { topicId: id, type: 'idiot', summary: e.target.value }
        }));
      });

      sheepSummary.addEventListener('change', (e) => {
        topic.sheepSummary = e.target.value;
        this.dispatchEvent(new CustomEvent('summary-changed', {
          detail: { topicId: id, type: 'sheep', summary: e.target.value }
        }));
      });

      // Add drop zones for arguments
      const idiotZone = topicEl.querySelector('.idiot-arguments');
      const sheepZone = topicEl.querySelector('.sheep-arguments');

      this.addDropZone(idiotZone, 'idiot');
      this.addDropZone(sheepZone, 'sheep');

      // Update argument lists
      this.updateTopicArguments(topic, idiotZone, sheepZone);

      topicsList.appendChild(topicEl);
    }
  }

  updateTopicArguments(topic, idiotZone, sheepZone) {
    // Clear existing arguments
    idiotZone.innerHTML = '';
    sheepZone.innerHTML = '';

    // Update compact arguments display
    const compactDisplay = idiotZone.closest('.topic')?.querySelector('.topic-compact-args');
    if (compactDisplay) {
      // Sort arguments by type and ID
      const sortedArgs = Array.from(topic.arguments).sort((a, b) => {
        const aType = a.startsWith('I') ? 0 : 1;
        const bType = b.startsWith('I') ? 0 : 1;
        if (aType !== bType) return aType - bType;
        return a.localeCompare(b);
      });

      compactDisplay.innerHTML = sortedArgs.map(argId => {
        const type = argId.startsWith('I') ? 'idiot' : 'sheep';
        return `<span class="compact-arg ${type}">${argId}</span>`;
      }).join('');
    }

    // Sort arguments for the expanded view too
    const idiotArgs = Array.from(topic.arguments)
      .filter(id => id.startsWith('I'))
      .sort((a, b) => a.localeCompare(b));
      
    const sheepArgs = Array.from(topic.arguments)
      .filter(id => id.startsWith('S'))
      .sort((a, b) => a.localeCompare(b));

    // Add arguments to their respective zones
    for (const argId of idiotArgs) {
      const arg = Array.from(this.idiotArguments).find(a => a.id === argId);
      if (!arg) continue;

      const argEl = document.createElement('div');
      argEl.className = 'topic-argument';
      argEl.innerHTML = `
        <span><span class="argument-id idiot">${arg.id}</span> ${arg.title}</span>
        <button class="remove-btn" data-arg-id="${argId}" data-topic-id="${topic.id}">&times;</button>
      `;

      const removeBtn = argEl.querySelector('.remove-btn');
      removeBtn.addEventListener('click', () => {
        topic.arguments.delete(argId);
        this.updateTopicArguments(topic, idiotZone, sheepZone);
        this.dispatchEvent(new CustomEvent('assignment-changed', {
          detail: { topicId: topic.id, argumentId: argId, assigned: false }
        }));
      });

      idiotZone.appendChild(argEl);
    }

    for (const argId of sheepArgs) {
      const arg = Array.from(this.sheepArguments).find(a => a.id === argId);
      if (!arg) continue;

      const argEl = document.createElement('div');
      argEl.className = 'topic-argument';
      argEl.innerHTML = `
        <span><span class="argument-id sheep">${arg.id}</span> ${arg.title}</span>
        <button class="remove-btn" data-arg-id="${argId}" data-topic-id="${topic.id}">&times;</button>
      `;

      const removeBtn = argEl.querySelector('.remove-btn');
      removeBtn.addEventListener('click', () => {
        topic.arguments.delete(argId);
        this.updateTopicArguments(topic, idiotZone, sheepZone);
        this.dispatchEvent(new CustomEvent('assignment-changed', {
          detail: { topicId: topic.id, argumentId: argId, assigned: false }
        }));
      });

      sheepZone.appendChild(argEl);
    }
  }

  addTopic() {
    const input = this.shadowRoot.getElementById('topicInput');
    const title = input.value.trim();
    if (!title) return;

    const id = 'T' + (this.topics.size + 1);
    this.topics.set(id, {
      id,
      title,
      arguments: new Set(),
      idiotSummary: '',
      sheepSummary: ''
    });

    input.value = '';
    this.renderTopics();
  }

  addArgument(type) {
    const input = this.shadowRoot.getElementById(`${type}ArgumentInput`);
    const details = this.shadowRoot.getElementById(`${type}ArgumentDetails`);
    const title = input.value.trim();
    const detailsText = details.value.trim();
    if (!title) return;

    const prefix = type === 'idiot' ? 'I' : 'S';
    const collection = type === 'idiot' ? this.idiotArguments : this.sheepArguments;
    const argumentId = prefix + (collection.size + 1);
    
    collection.add({
      id: argumentId,
      title,
      details: detailsText,
      type
    });

    this.renderArguments(type);
    input.value = '';
    details.value = '';
  }

  assignArgumentToTopic(argumentId, topicId) {
    const topic = this.topics.get(topicId);
    if (!topic) return;

    // Add to topic if not already there
    if (!topic.arguments.has(argumentId)) {
      topic.arguments.add(argumentId);
      
      // Re-render to update visual state
      const type = argumentId.startsWith('I') ? 'idiot' : 'sheep';
      this.renderArguments(type);
      this.renderTopics();

      this.dispatchEvent(new CustomEvent('assignment-changed', {
        detail: { topicId: topicId, argumentId, action: 'added' }
      }));
    }
  }

  removeArgument(id, type, topicId = null) {
    const collection = type === 'idiot' ? this.idiotArguments : this.sheepArguments;
    const argument = Array.from(collection).find(arg => arg.id === id);
    if (!argument) return;

    if (topicId) {
      // Just remove from specific topic
      const topic = this.topics.get(topicId);
      if (topic) {
        topic.arguments.delete(id);
        this.renderTopics();
        this.renderArguments(type); // Re-render to update visual state
        
        this.dispatchEvent(new CustomEvent('assignment-changed', {
          detail: { argumentId: id, topicId, action: 'removed' }
        }));
      }
    } else {
      // Delete completely
      collection.delete(argument);
      // Remove from all topics
      for (const [topicId, topic] of this.topics) {
        if (topic.arguments.has(id)) {
          topic.arguments.delete(id);
          this.dispatchEvent(new CustomEvent('assignment-changed', {
            detail: { argumentId: id, topicId, action: 'removed' }
          }));
        }
      }
      this.renderArguments(type);
      this.renderTopics();
    }
  }

  // Public methods to load existing data
  setTopics(topics) {
    this.topics = new Map(topics.map(t => [
      t.id,
      {
        ...t,
        arguments: new Set(t.arguments)
      }
    ]));
    this.renderTopics();
    // Re-render arguments to show assignment status
    this.renderArguments('idiot');
    this.renderArguments('sheep');
  }

  setIdiotArguments(args) {
    this.idiotArguments = new Set(args);
    this.renderArguments('idiot');
  }

  setSheepArguments(args) {
    this.sheepArguments = new Set(args);
    this.renderArguments('sheep');
  }

  // Method to load all data at once
  loadData(data) {
    console.log('Loading data:', data);
    
    // Reset existing data
    this.topics.clear();
    this.idiotArguments.clear();
    this.sheepArguments.clear();

    // Load topics
    data.topics.forEach(topic => {
      this.topics.set(topic.id, {
        ...topic,
        arguments: new Set(topic.arguments)
      });
    });
    console.log('Topics loaded:', this.topics);

    // Load arguments
    data.arguments.idiot.forEach(arg => {
      this.idiotArguments.add({
        id: arg.id,
        title: arg.title,
        details: arg.details,
        type: 'idiot'
      });
    });
    
    data.arguments.sheep.forEach(arg => {
      this.sheepArguments.add({
        id: arg.id,
        title: arg.title,
        details: arg.details,
        type: 'sheep'
      });
    });
    
    console.log('Arguments loaded:', {
      idiot: this.idiotArguments,
      sheep: this.sheepArguments
    });

    // Render everything
    requestAnimationFrame(() => {
      this.renderTopics();
      this.renderArguments('idiot');
      this.renderArguments('sheep');
    });
  }

  updateArgumentBadges(argId, badgeContainer) {
    const assignments = this.getArgumentAssignments(argId);
    badgeContainer.innerHTML = assignments.map(topic => 
      `<span class="topic-badge" title="${topic.title}">${topic.id}</span>`
    ).join('');
  }

  deleteArgument(id, type) {
    const collection = type === 'idiot' ? this.idiotArguments : this.sheepArguments;
    const argument = Array.from(collection).find(arg => arg.id === id);
    if (!argument) return;

    // Remove from all topics
    for (const [topicId, topic] of this.topics) {
      if (topic.arguments.has(id)) {
        topic.arguments.delete(id);
        this.dispatchEvent(new CustomEvent('assignment-changed', {
          detail: { argumentId: id, topicId, action: 'removed' }
        }));
      }
    }

    collection.delete(argument);
    this.renderArguments(type);
    this.renderTopics();
  }

  showConfirmDialog(message, onConfirm) {
    const dialog = this.shadowRoot.getElementById('confirmDialog');
    const messageEl = this.shadowRoot.getElementById('confirmMessage');
    const confirmBtn = this.shadowRoot.getElementById('confirmDeleteButton');
    const cancelBtn = this.shadowRoot.getElementById('cancelConfirmDialog');

    messageEl.textContent = message;
    dialog.style.display = 'flex';

    const closeDialog = () => {
      dialog.style.display = 'none';
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
      dialog.removeEventListener('click', handleOutsideClick);
    };

    const handleConfirm = () => {
      onConfirm();
      closeDialog();
    };

    const handleCancel = () => {
      closeDialog();
    };

    const handleOutsideClick = (e) => {
      if (e.target === dialog) {
        closeDialog();
      }
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    dialog.addEventListener('click', handleOutsideClick);
  }

  loadFromJson(data) {
    try {
      // Clear existing data
      this.topics.clear();
      this.idiotArguments.clear();
      this.sheepArguments.clear();

      // Load topics
      if (data.topics) {
        for (const [id, topic] of Object.entries(data.topics)) {
          this.topics.set(id, {
            ...topic,
            arguments: new Set(topic.arguments)
          });
        }
      }

      // Load arguments
      if (data.arguments) {
        if (data.arguments.idiot) {
          data.arguments.idiot.forEach(arg => this.idiotArguments.add(arg));
        }
        if (data.arguments.sheep) {
          data.arguments.sheep.forEach(arg => this.sheepArguments.add(arg));
        }
      }

      // Refresh view
      this.renderTopics();
      this.renderArguments('idiot');
      this.renderArguments('sheep');
    } catch (error) {
      console.error('Error loading JSON data:', error);
      alert('Error loading JSON data');
    }
  }

  exportToJson() {
    const data = {
      topics: Object.fromEntries(
        Array.from(this.topics.entries()).map(([id, topic]) => [
          id,
          {
            ...topic,
            arguments: Array.from(topic.arguments)
          }
        ])
      ),
      arguments: {
        idiot: Array.from(this.idiotArguments),
        sheep: Array.from(this.sheepArguments)
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'topics-export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

customElements.define('topic-manager', TopicManager);
