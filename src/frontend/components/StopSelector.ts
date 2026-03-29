/**
 * Stop Selector Component
 * Allows passengers to select their desired drop-off stop
 * Provides visual feedback for selection and maintains single selection invariant
 */

import { Stop } from '../../shared/types';

export interface StopSelectorCallbacks {
  onStopSelected?: (stopId: string) => void;
}

export class StopSelector {
  private containerElement: HTMLElement;
  private callbacks: StopSelectorCallbacks;
  private selectedStopId: string | null = null;
  private currentStops: Stop[] = [];

  /**
   * Create a new StopSelector instance
   * @param containerElementId - ID of the HTML element to display selectable stops
   * @param callbacks - Callback functions for stop selection
   */
  constructor(
    containerElementId: string,
    callbacks: StopSelectorCallbacks = {}
  ) {
    const containerEl = document.getElementById(containerElementId);

    if (!containerEl) {
      throw new Error(`Element with id "${containerElementId}" not found`);
    }

    this.containerElement = containerEl;
    this.callbacks = callbacks;
  }

  /**
   * Display selectable stops
   * @param stops - Array of stops to display as selectable options
   */
  displayStops(stops: Stop[]): void {
    // Store current stops
    this.currentStops = stops;

    // Clear existing content
    this.containerElement.innerHTML = '';

    if (stops.length === 0) {
      this.containerElement.innerHTML = '<p class="no-stops">No stops available for selection</p>';
      return;
    }

    // Create instruction text
    const instruction = document.createElement('p');
    instruction.className = 'stop-selector-instruction';
    instruction.textContent = 'Click on a stop to select it as your drop-off location:';
    this.containerElement.appendChild(instruction);

    // Create stops list
    const stopsList = document.createElement('ul');
    stopsList.className = 'selectable-stops-list';

    stops.forEach((stop, index) => {
      const stopItem = document.createElement('li');
      stopItem.className = 'selectable-stop-item';
      stopItem.dataset.stopId = stop.id;

      // Add selected class if this is the selected stop
      if (this.selectedStopId === stop.id) {
        stopItem.classList.add('selected');
      }

      // Create stop content
      const stopContent = document.createElement('div');
      stopContent.className = 'selectable-stop-content';

      const stopNumber = document.createElement('span');
      stopNumber.className = 'selectable-stop-number';
      stopNumber.textContent = `${index + 1}.`;

      const stopName = document.createElement('span');
      stopName.className = 'selectable-stop-name';
      stopName.textContent = stop.name;

      const stopAddress = document.createElement('span');
      stopAddress.className = 'selectable-stop-address';
      stopAddress.textContent = stop.address;

      stopContent.appendChild(stopNumber);
      stopContent.appendChild(stopName);
      stopContent.appendChild(stopAddress);
      stopItem.appendChild(stopContent);

      // Add click handler
      stopItem.addEventListener('click', () => {
        this.onStopSelected(stop.id);
      });

      stopsList.appendChild(stopItem);
    });

    this.containerElement.appendChild(stopsList);

    // Display selected stop info if there is one
    if (this.selectedStopId) {
      this.displaySelectedStopInfo();
    }
  }

  /**
   * Handle stop selection
   * @param stopId - ID of the selected stop
   */
  onStopSelected(stopId: string): void {
    // Update selected stop ID (maintains single selection invariant)
    this.selectedStopId = stopId;

    // Update visual selection in the stops list
    const stopItems = this.containerElement.querySelectorAll('.selectable-stop-item');
    stopItems.forEach(item => {
      if (item instanceof HTMLElement && item.dataset.stopId === stopId) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });

    // Display selected stop info
    this.displaySelectedStopInfo();

    // Call callback if provided
    if (this.callbacks.onStopSelected) {
      this.callbacks.onStopSelected(stopId);
    }
  }

  /**
   * Display information about the currently selected stop
   */
  private displaySelectedStopInfo(): void {
    // Remove existing selected stop info if present
    const existingInfo = this.containerElement.querySelector('.selected-stop-info');
    if (existingInfo) {
      existingInfo.remove();
    }

    if (!this.selectedStopId) {
      return;
    }

    // Find the selected stop
    const selectedStop = this.currentStops.find(stop => stop.id === this.selectedStopId);
    if (!selectedStop) {
      return;
    }

    // Create selected stop info display
    const infoContainer = document.createElement('div');
    infoContainer.className = 'selected-stop-info';

    const infoHeader = document.createElement('h3');
    infoHeader.className = 'selected-stop-header';
    infoHeader.textContent = 'Your Selected Drop-off Stop:';

    const infoContent = document.createElement('div');
    infoContent.className = 'selected-stop-details';

    const stopName = document.createElement('p');
    stopName.className = 'selected-stop-name-display';
    stopName.innerHTML = `<strong>${selectedStop.name}</strong>`;

    const stopAddress = document.createElement('p');
    stopAddress.className = 'selected-stop-address-display';
    stopAddress.textContent = selectedStop.address;

    infoContent.appendChild(stopName);
    infoContent.appendChild(stopAddress);

    infoContainer.appendChild(infoHeader);
    infoContainer.appendChild(infoContent);

    // Add to container
    this.containerElement.appendChild(infoContainer);
  }

  /**
   * Get currently selected stop ID
   * @returns Selected stop ID or null if none selected
   */
  getSelectedStop(): string | null {
    return this.selectedStopId;
  }

  /**
   * Clear the current selection
   */
  clearSelection(): void {
    this.selectedStopId = null;

    // Remove selected class from all stop items
    const stopItems = this.containerElement.querySelectorAll('.selectable-stop-item');
    stopItems.forEach(item => {
      item.classList.remove('selected');
    });

    // Remove selected stop info display
    const existingInfo = this.containerElement.querySelector('.selected-stop-info');
    if (existingInfo) {
      existingInfo.remove();
    }
  }

  /**
   * Clear the stops display
   */
  clearStops(): void {
    this.containerElement.innerHTML = '';
    this.selectedStopId = null;
    this.currentStops = [];
  }
}
