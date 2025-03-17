import React, { Fragment } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

interface ComboboxItem {
  id: string;
  [key: string]: string | number | boolean | null | undefined;
}

interface EnhancedComboboxProps<T extends ComboboxItem> {
  items: T[];
  selectedItem: T | null;
  onChange: (item: T) => void;
  onQueryChange: (query: string) => void;
  displayValue: (item: T) => string;
  placeholder?: string;
  label?: string;
  query: string;
  noResultsText?: string;
  className?: string;
}

export default function EnhancedCombobox<T extends ComboboxItem>({
  items,
  selectedItem,
  onChange,
  onQueryChange,
  displayValue,
  placeholder = 'Select an item',
  label,
  query,
  noResultsText = 'No results found',
  className = ''
}: EnhancedComboboxProps<T>) {
  const filteredItems = items.filter((item) =>
    displayValue(item)
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <div className={className}>
      <Combobox value={selectedItem} onChange={onChange}>
        <div className="relative">
          {label && (
            <Combobox.Label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </Combobox.Label>
          )}
          <div className="relative">
            <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-gray-300 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-all duration-200">
              <Combobox.Input
                className="w-full border-none py-3 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                displayValue={displayValue}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder={placeholder}
              />
              <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon
                  className="h-5 w-5 text-gray-400 hover:text-primary-500 transition-colors duration-200"
                  aria-hidden="true"
                />
              </Combobox.Button>
            </div>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
              afterLeave={() => onQueryChange('')}
            >
              <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {filteredItems.length === 0 && query !== '' ? (
                  <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                    {noResultsText}
                  </div>
                ) : (
                  filteredItems.map((item) => (
                    <Combobox.Option
                      key={item.id}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active ? 'bg-primary-600 text-white' : 'text-gray-900'
                        }`
                      }
                      value={item}
                    >
                      {({ selected, active }) => (
                        <>
                          <span
                            className={`block truncate ${
                              selected ? 'font-medium' : 'font-normal'
                            }`}
                          >
                            {displayValue(item)}
                          </span>
                          {selected ? (
                            <span
                              className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                active ? 'text-white' : 'text-primary-600'
                              }`}
                            >
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Combobox.Option>
                  ))
                )}
              </Combobox.Options>
            </Transition>
          </div>
        </div>
      </Combobox>
    </div>
  );
} 