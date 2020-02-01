// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
'use strict';
import { CursorPos, IMainState } from '../../../interactive-common/mainState';
import { Helpers } from '../../../interactive-common/redux/reducers/helpers';
import { Transfer } from '../../../interactive-common/redux/reducers/transfer';
import { ICellAction, ICodeAction } from '../../../interactive-common/redux/reducers/types';
import { NativeEditorReducerArg } from '../mapping';
import { Effects } from './effects';

export namespace Movement {
    export function swapCells(arg: NativeEditorReducerArg<{ firstCellId: string; secondCellId: string }>) {
        const newVMs = [...arg.prevState.cellVMs];
        const first = newVMs.findIndex(cvm => cvm.cell.id === arg.payload.firstCellId);
        const second = newVMs.findIndex(cvm => cvm.cell.id === arg.payload.secondCellId);
        if (first >= 0 && second >= 0) {
            const temp = newVMs[first];
            newVMs[first] = newVMs[second];
            newVMs[second] = temp;
            Transfer.postModelSwap(arg, arg.payload.firstCellId, arg.payload.secondCellId);
            return {
                ...arg.prevState,
                cellVMs: newVMs,
                undoStack: Helpers.pushStack(arg.prevState.undoStack, arg.prevState.cellVMs)
            };
        }

        return arg.prevState;
    }

    export function moveCellUp(arg: NativeEditorReducerArg<ICellAction>): IMainState {
        const index = arg.prevState.cellVMs.findIndex(cvm => cvm.cell.id === arg.payload.cellId);
        if (index > 0 && arg.payload.cellId) {
            return swapCells({ ...arg, payload: { firstCellId: arg.prevState.cellVMs[index - 1].cell.id, secondCellId: arg.payload.cellId } });
        }

        return arg.prevState;
    }

    export function moveCellDown(arg: NativeEditorReducerArg<ICellAction>): IMainState {
        const newVMs = [...arg.prevState.cellVMs];
        const index = newVMs.findIndex(cvm => cvm.cell.id === arg.payload.cellId);
        if (index < newVMs.length - 1 && arg.payload.cellId) {
            return swapCells({ ...arg, payload: { firstCellId: arg.payload.cellId, secondCellId: arg.prevState.cellVMs[index + 1].cell.id } });
        }

        return arg.prevState;
    }

    export function arrowUp(arg: NativeEditorReducerArg<ICodeAction>): IMainState {
        const index = arg.prevState.cellVMs.findIndex(c => c.cell.id === arg.payload.cellId);
        if (index > 0) {
            const newState = Effects.selectCell({ ...arg, payload: { cellId: arg.prevState.cellVMs[index - 1].cell.id, cursorPos: CursorPos.Bottom } });
            const newVMs = [...newState.cellVMs];
            newVMs[index] = Helpers.asCellViewModel({
                ...newVMs[index],
                inputBlockText: arg.payload.code,
                cell: { ...newVMs[index].cell, data: { ...newVMs[index].cell.data, source: arg.payload.code } }
            });
            return {
                ...newState,
                cellVMs: newVMs
            };
        }

        return arg.prevState;
    }

    export function arrowDown(arg: NativeEditorReducerArg<ICodeAction>): IMainState {
        const index = arg.prevState.cellVMs.findIndex(c => c.cell.id === arg.payload.cellId);
        if (index < arg.prevState.cellVMs.length - 1) {
            const newState = Effects.selectCell({ ...arg, payload: { cellId: arg.prevState.cellVMs[index + 1].cell.id, cursorPos: CursorPos.Top } });
            const newVMs = [...newState.cellVMs];
            newVMs[index] = Helpers.asCellViewModel({
                ...newVMs[index],
                inputBlockText: arg.payload.code,
                cell: { ...newVMs[index].cell, data: { ...newVMs[index].cell.data, source: arg.payload.code } }
            });
            return {
                ...newState,
                cellVMs: newVMs
            };
        }

        return arg.prevState;
    }
}
