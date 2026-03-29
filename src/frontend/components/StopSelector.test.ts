/**
 * Unit tests for StopSelector component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { StopSelector } from './StopSelector';
import { Stop } from '../../shared/types';

describe('StopSelector', () => {
  let container: HTMLElement;
  let stopSelector: StopSelector;

  beforeEach(() => {
    // Set up DOM elements
    document.body.innerHTML = `
      <div id="stop-selector"></div>
    `;

    container = document.getElementById('stop-selector')!;
    stopSelector = new StopSelector('stop-selector');
  });

  describe('constructor', () => {
    it('should throw error if container element not found', () => {
      expect(() => {
        new StopSelector('non-existent');
      }).toThrow('Element with id "non-existent" not found');
    });

    it('should create instance successfully with valid element ID', () => {
      expect(stopSelector).toBeInstanceOf(StopSelector);
    });
  });

  describe('displayStops', () => {
    it('should display empty state when no stops provided', () => {
      stopSelector.displayStops([]);

      expect(container.innerHTML).toContain('No stops available for selection');
    });

    it('should display instruction text when stops are available', () => {
      const stops: Stop[] = [
        {
          id: 'stop-1',
          name: 'Main St & 1st Ave',
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      stopSelector.displayStops(stops);

      expect(container.textContent).toContain('Click on a stop to select it as your drop-off location');
    });

    it('should display single stop as selectable option', () => {
      const stops: Stop[] = [
        {
          id: 'stop-1',
          name: 'Main St & 1st Ave',
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      stopSelector.displayStops(stops);

      expect(container.textContent).toContain('Main St & 1st Ave');
      expect(container.textContent).toContain('123 Main St');

      const stopItems = container.querySelectorAll('.selectable-stop-item');
      expect(stopItems.length).toBe(1);
    });

    it('should display multiple stops as selectable options', () => {
      const stops: Stop[] = [
        {
          id: 'stop-1',
          name: 'Main St & 1st Ave',
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'stop-2',
          name: 'Main St & 2nd Ave',
          latitude: 40.7138,
          longitude: -74.0050,
          address: '456 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'stop-3',
          name: 'Main St & 3rd Ave',
          latitude: 40.7148,
          longitude: -74.0040,
          address: '789 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      stopSelector.displayStops(stops);

      const stopItems = container.querySelectorAll('.selectable-stop-item');
      expect(stopItems.length).toBe(3);

      expect(container.textContent).toContain('Main St & 1st Ave');
      expect(container.textContent).toContain('Main St & 2nd Ave');
      expect(container.textContent).toContain('Main St & 3rd Ave');
    });

    it('should display stops with sequential numbering', () => {
      const stops: Stop[] = [
        {
          id: 'stop-1',
          name: 'Main St & 1st Ave',
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'stop-2',
          name: 'Main St & 2nd Ave',
          latitude: 40.7138,
          longitude: -74.0050,
          address: '456 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      stopSelector.displayStops(stops);

      const stopNumbers = container.querySelectorAll('.selectable-stop-number');
      expect(stopNumbers[0].textContent).toBe('1.');
      expect(stopNumbers[1].textContent).toBe('2.');
    });

    it('should add click handlers to stop items', () => {
      const stops: Stop[] = [
        {
          id: 'stop-1',
          name: 'Main St & 1st Ave',
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const callback = vi.fn();
      stopSelector = new StopSelector('stop-selector', {
        onStopSelected: callback
      });

      stopSelector.displayStops(stops);

      const stopItem = container.querySelector('.selectable-stop-item') as HTMLElement;
      stopItem.click();

      expect(callback).toHaveBeenCalledWith('stop-1');
    });

    it('should mark selected stop with selected class', () => {
      const stops: Stop[] = [
        {
          id: 'stop-1',
          name: 'Main St & 1st Ave',
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'stop-2',
          name: 'Main St & 2nd Ave',
          latitude: 40.7138,
          longitude: -74.0050,
          address: '456 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      stopSelector.displayStops(stops);

      // Select first stop
      const firstStopItem = container.querySelector('[data-stop-id="stop-1"]') as HTMLElement;
      firstStopItem.click();

      expect(firstStopItem.classList.contains('selected')).toBe(true);

      // Re-display stops and verify selection is maintained
      stopSelector.displayStops(stops);
      const updatedFirstStop = container.querySelector('[data-stop-id="stop-1"]') as HTMLElement;
      expect(updatedFirstStop.classList.contains('selected')).toBe(true);
    });

    it('should display selected stop info when a stop is selected', () => {
      const stops: Stop[] = [
        {
          id: 'stop-1',
          name: 'Main St & 1st Ave',
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      stopSelector.displayStops(stops);

      // Select stop
      const stopItem = container.querySelector('[data-stop-id="stop-1"]') as HTMLElement;
      stopItem.click();

      // Check for selected stop info
      expect(container.textContent).toContain('Your Selected Drop-off Stop:');
      expect(container.textContent).toContain('Main St & 1st Ave');
    });
  });

  describe('onStopSelected', () => {
    it('should update selected stop ID', () => {
      stopSelector.onStopSelected('stop-1');

      expect(stopSelector.getSelectedStop()).toBe('stop-1');
    });

    it('should call callback when stop is selected', () => {
      const callback = vi.fn();
      stopSelector = new StopSelector('stop-selector', {
        onStopSelected: callback
      });

      stopSelector.onStopSelected('stop-1');

      expect(callback).toHaveBeenCalledWith('stop-1');
    });

    it('should update visual selection in stops list', () => {
      const stops: Stop[] = [
        {
          id: 'stop-1',
          name: 'Main St & 1st Ave',
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'stop-2',
          name: 'Main St & 2nd Ave',
          latitude: 40.7138,
          longitude: -74.0050,
          address: '456 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      stopSelector.displayStops(stops);

      // Select first stop
      stopSelector.onStopSelected('stop-1');

      const stop1 = container.querySelector('[data-stop-id="stop-1"]');
      const stop2 = container.querySelector('[data-stop-id="stop-2"]');

      expect(stop1?.classList.contains('selected')).toBe(true);
      expect(stop2?.classList.contains('selected')).toBe(false);

      // Select second stop (should clear previous selection)
      stopSelector.onStopSelected('stop-2');

      expect(stop1?.classList.contains('selected')).toBe(false);
      expect(stop2?.classList.contains('selected')).toBe(true);
    });

    it('should maintain single selection invariant when changing selection', () => {
      const stops: Stop[] = [
        {
          id: 'stop-1',
          name: 'Main St & 1st Ave',
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'stop-2',
          name: 'Main St & 2nd Ave',
          latitude: 40.7138,
          longitude: -74.0050,
          address: '456 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      stopSelector.displayStops(stops);

      // Select first stop
      stopSelector.onStopSelected('stop-1');
      expect(stopSelector.getSelectedStop()).toBe('stop-1');

      // Select second stop
      stopSelector.onStopSelected('stop-2');
      expect(stopSelector.getSelectedStop()).toBe('stop-2');

      // Verify only one stop is selected
      const selectedItems = container.querySelectorAll('.selectable-stop-item.selected');
      expect(selectedItems.length).toBe(1);
    });
  });

  describe('getSelectedStop', () => {
    it('should return null when no stop is selected', () => {
      expect(stopSelector.getSelectedStop()).toBeNull();
    });

    it('should return selected stop ID', () => {
      stopSelector.onStopSelected('stop-1');

      expect(stopSelector.getSelectedStop()).toBe('stop-1');
    });

    it('should return updated stop ID after changing selection', () => {
      stopSelector.onStopSelected('stop-1');
      expect(stopSelector.getSelectedStop()).toBe('stop-1');

      stopSelector.onStopSelected('stop-2');
      expect(stopSelector.getSelectedStop()).toBe('stop-2');
    });
  });

  describe('clearSelection', () => {
    it('should clear selected stop ID', () => {
      stopSelector.onStopSelected('stop-1');
      expect(stopSelector.getSelectedStop()).toBe('stop-1');

      stopSelector.clearSelection();
      expect(stopSelector.getSelectedStop()).toBeNull();
    });

    it('should remove selected class from all stop items', () => {
      const stops: Stop[] = [
        {
          id: 'stop-1',
          name: 'Main St & 1st Ave',
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'stop-2',
          name: 'Main St & 2nd Ave',
          latitude: 40.7138,
          longitude: -74.0050,
          address: '456 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      stopSelector.displayStops(stops);

      // Select a stop
      stopSelector.onStopSelected('stop-1');
      const stop1 = container.querySelector('[data-stop-id="stop-1"]');
      expect(stop1?.classList.contains('selected')).toBe(true);

      // Clear selection
      stopSelector.clearSelection();
      expect(stop1?.classList.contains('selected')).toBe(false);

      // Verify no stops are selected
      const selectedItems = container.querySelectorAll('.selectable-stop-item.selected');
      expect(selectedItems.length).toBe(0);
    });

    it('should remove selected stop info display', () => {
      const stops: Stop[] = [
        {
          id: 'stop-1',
          name: 'Main St & 1st Ave',
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      stopSelector.displayStops(stops);

      // Select a stop
      stopSelector.onStopSelected('stop-1');
      expect(container.querySelector('.selected-stop-info')).not.toBeNull();

      // Clear selection
      stopSelector.clearSelection();
      expect(container.querySelector('.selected-stop-info')).toBeNull();
    });
  });

  describe('clearStops', () => {
    it('should clear stops display', () => {
      const stops: Stop[] = [
        {
          id: 'stop-1',
          name: 'Main St & 1st Ave',
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      stopSelector.displayStops(stops);
      expect(container.innerHTML).not.toBe('');

      stopSelector.clearStops();
      expect(container.innerHTML).toBe('');
    });

    it('should clear selected stop ID', () => {
      stopSelector.onStopSelected('stop-1');
      expect(stopSelector.getSelectedStop()).toBe('stop-1');

      stopSelector.clearStops();
      expect(stopSelector.getSelectedStop()).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle selecting first stop', () => {
      const stops: Stop[] = [
        {
          id: 'stop-1',
          name: 'First Stop',
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'stop-2',
          name: 'Second Stop',
          latitude: 40.7138,
          longitude: -74.0050,
          address: '456 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      stopSelector.displayStops(stops);
      stopSelector.onStopSelected('stop-1');

      expect(stopSelector.getSelectedStop()).toBe('stop-1');
      const stop1 = container.querySelector('[data-stop-id="stop-1"]');
      expect(stop1?.classList.contains('selected')).toBe(true);
    });

    it('should handle selecting last stop', () => {
      const stops: Stop[] = [
        {
          id: 'stop-1',
          name: 'First Stop',
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'stop-2',
          name: 'Last Stop',
          latitude: 40.7138,
          longitude: -74.0050,
          address: '456 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      stopSelector.displayStops(stops);
      stopSelector.onStopSelected('stop-2');

      expect(stopSelector.getSelectedStop()).toBe('stop-2');
      const stop2 = container.querySelector('[data-stop-id="stop-2"]');
      expect(stop2?.classList.contains('selected')).toBe(true);
    });

    it('should handle rapid consecutive selections', () => {
      const stops: Stop[] = [
        {
          id: 'stop-1',
          name: 'Stop 1',
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'stop-2',
          name: 'Stop 2',
          latitude: 40.7138,
          longitude: -74.0050,
          address: '456 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'stop-3',
          name: 'Stop 3',
          latitude: 40.7148,
          longitude: -74.0040,
          address: '789 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      stopSelector.displayStops(stops);

      // Rapidly select different stops
      stopSelector.onStopSelected('stop-1');
      stopSelector.onStopSelected('stop-2');
      stopSelector.onStopSelected('stop-3');
      stopSelector.onStopSelected('stop-1');

      // Should maintain single selection invariant
      expect(stopSelector.getSelectedStop()).toBe('stop-1');
      const selectedItems = container.querySelectorAll('.selectable-stop-item.selected');
      expect(selectedItems.length).toBe(1);
    });

    it('should handle re-selecting the same stop', () => {
      const stops: Stop[] = [
        {
          id: 'stop-1',
          name: 'Main St & 1st Ave',
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const callback = vi.fn();
      stopSelector = new StopSelector('stop-selector', {
        onStopSelected: callback
      });

      stopSelector.displayStops(stops);

      // Select same stop twice
      stopSelector.onStopSelected('stop-1');
      stopSelector.onStopSelected('stop-1');

      expect(stopSelector.getSelectedStop()).toBe('stop-1');
      expect(callback).toHaveBeenCalledTimes(2);
    });
  });
});

// Feature: bus-tracking-system, Property 4: Stop Selection Registration
describe('Property 4: Stop Selection Registration', () => {
  /**
   * Validates: Requirements 2.2
   * For any stop, when a passenger clicks on it, the system must mark that stop
   * as the currently selected drop-off location.
   */
  it('clicking any stop registers it as the selected drop-off location', () => {
    const stopArb = fc.record({
      id: fc.uniqueArray(fc.hexaString({ minLength: 4, maxLength: 8 }), { minLength: 1, maxLength: 1 }).map(arr => arr[0]),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      latitude: fc.float({ min: -90, max: 90, noNaN: true }),
      longitude: fc.float({ min: -180, max: 180, noNaN: true }),
      address: fc.string({ minLength: 1, maxLength: 100 }),
      createdAt: fc.constant(new Date()),
      updatedAt: fc.constant(new Date()),
    });

    fc.assert(
      fc.property(
        fc.uniqueArray(stopArb, { minLength: 1, maxLength: 20, selector: s => s.id }),
        (stops: Stop[]) => {
          document.body.innerHTML = '<div id="stop-selector-prop4"></div>';
          const selector = new StopSelector('stop-selector-prop4');

          selector.displayStops(stops);

          // For each stop, simulate a click and verify it becomes the selected stop
          for (const stop of stops) {
            selector.onStopSelected(stop.id);
            expect(selector.getSelectedStop()).toBe(stop.id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: bus-tracking-system, Property 3: All Stops Selectable
describe('Property 3: All Stops Selectable', () => {
  /**
   * Validates: Requirements 2.1
   * For any route being viewed, all stops on that route must be displayed
   * as selectable options in the stop selector.
   */
  it('all stops in a route are rendered as selectable elements', () => {
    const stopArb = fc.record({
      id: fc.uniqueArray(fc.hexaString({ minLength: 4, maxLength: 8 }), { minLength: 1, maxLength: 1 }).map(arr => arr[0]),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      latitude: fc.float({ min: -90, max: 90, noNaN: true }),
      longitude: fc.float({ min: -180, max: 180, noNaN: true }),
      address: fc.string({ minLength: 1, maxLength: 100 }),
      createdAt: fc.constant(new Date()),
      updatedAt: fc.constant(new Date()),
    });

    fc.assert(
      fc.property(
        fc.uniqueArray(stopArb, { minLength: 1, maxLength: 20, selector: s => s.id }),
        (stops: Stop[]) => {
          document.body.innerHTML = '<div id="stop-selector-prop"></div>';
          const selector = new StopSelector('stop-selector-prop');

          selector.displayStops(stops);

          // Every stop must have a corresponding selectable element with data-stop-id
          for (const stop of stops) {
            const el = document.querySelector(`[data-stop-id="${stop.id}"]`);
            expect(el).not.toBeNull();
          }

          // The total number of selectable items must equal the number of stops
          const items = document.querySelectorAll('.selectable-stop-item');
          expect(items.length).toBe(stops.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
