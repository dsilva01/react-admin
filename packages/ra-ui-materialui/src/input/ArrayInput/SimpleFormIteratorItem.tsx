import * as React from 'react';
import {
    Children,
    cloneElement,
    MouseEvent,
    MouseEventHandler,
    isValidElement,
    ReactElement,
    ReactNode,
    useMemo,
} from 'react';
import { Typography } from '@mui/material';
import clsx from 'clsx';
import { getFieldLabelTranslationArgs, RaRecord, useTranslate } from 'ra-core';

import { SimpleFormIteratorClasses } from './useSimpleFormIteratorStyles';
import { useSimpleFormIterator } from './useSimpleFormIterator';
import { ArrayInputContextValue } from './ArrayInputContext';
import {
    SimpleFormIteratorItemContext,
    SimpleFormIteratorItemContextValue,
} from './SimpleFormIteratorItemContext';

export const SimpleFormIteratorItem = React.forwardRef(
    (props: SimpleFormIteratorItemProps, ref: any) => {
        const {
            children,
            disabled,
            disableReordering,
            disableRemove,
            getItemLabel,
            index,
            member,
            record,
            removeButton,
            reOrderButtons,
            resource,
            source,
        } = props;

        const translate = useTranslate();
        const {
            total,
            reOrder,
            remove,
            source: parentSource,
        } = useSimpleFormIterator();
        // Returns a boolean to indicate whether to disable the remove button for certain fields.
        // If disableRemove is a function, then call the function with the current record to
        // determining if the button should be disabled. Otherwise, use a boolean property that
        // enables or disables the button for all of the fields.
        const disableRemoveField = (record: RaRecord) => {
            if (typeof disableRemove === 'boolean') {
                return disableRemove;
            }
            return disableRemove && disableRemove(record);
        };

        // remove field and call the onClick event of the button passed as removeButton prop
        const handleRemoveButtonClick = (
            originalOnClickHandler: MouseEventHandler,
            index: number
        ) => (event: MouseEvent) => {
            remove(index);
            if (originalOnClickHandler) {
                originalOnClickHandler(event);
            }
        };

        const context = useMemo<SimpleFormIteratorItemContextValue>(
            () => ({
                index,
                total,
                reOrder: newIndex => reOrder(index, newIndex),
                remove: () => remove(index),
            }),
            [index, total, reOrder, remove]
        );

        return (
            <SimpleFormIteratorItemContext.Provider value={context}>
                <li className={SimpleFormIteratorClasses.line} ref={ref}>
                    <div>
                        <div
                            className={SimpleFormIteratorClasses.indexContainer}
                        >
                            <Typography
                                variant="body1"
                                className={SimpleFormIteratorClasses.index}
                            >
                                {getItemLabel(index)}
                            </Typography>
                            {!disabled &&
                                !disableReordering &&
                                cloneElement(reOrderButtons, {
                                    index,
                                    max: total,
                                    reOrder,
                                    className: clsx(
                                        'button-reorder',
                                        `button-reorder-${source}-${index}`
                                    ),
                                })}
                        </div>
                    </div>
                    <section className={SimpleFormIteratorClasses.form}>
                        {Children.map(
                            children,
                            (input: ReactElement, index2) => {
                                if (!isValidElement<any>(input)) {
                                    return null;
                                }
                                const { source, ...inputProps } = input.props;
                                return cloneElement(input, {
                                    source: source
                                        ? `${member}.${source}`
                                        : member,
                                    index: source ? undefined : index2,
                                    label:
                                        input.props.label === '' ||
                                        input.props.label === false
                                            ? input.props.label
                                            : // We can't rely on the default label inference done in the input by FieldTitle because
                                              // at the time it renders, its source will be something like `arraySource.0.inputSource`
                                              // and inference will fail
                                              translate(
                                                  ...getFieldLabelTranslationArgs(
                                                      {
                                                          parentSource,
                                                          resource,
                                                          source,
                                                      }
                                                  )
                                              ),
                                    disabled,
                                    ...inputProps,
                                });
                            }
                        )}
                    </section>
                    {!disabled && !disableRemoveField(record) && (
                        <span className={SimpleFormIteratorClasses.action}>
                            {cloneElement(removeButton, {
                                onClick: handleRemoveButtonClick(
                                    removeButton.props.onClick,
                                    index
                                ),
                                className: clsx(
                                    'button-remove',
                                    `button-remove-${source}-${index}`
                                ),
                            })}
                        </span>
                    )}
                </li>
            </SimpleFormIteratorItemContext.Provider>
        );
    }
);

export type DisableRemoveFunction = (record: RaRecord) => boolean;

export type SimpleFormIteratorItemProps = Partial<ArrayInputContextValue> & {
    children?: ReactNode;
    disabled?: boolean;
    disableRemove?: boolean | DisableRemoveFunction;
    disableReordering?: boolean;
    getItemLabel?: (index: number) => string;
    index: number;
    member: string;
    onRemoveField: (index: number) => void;
    onReorder: (origin: number, destination: number) => void;
    record: RaRecord;
    removeButton?: ReactElement;
    reOrderButtons?: ReactElement;
    resource: string;
    source: string;
};
