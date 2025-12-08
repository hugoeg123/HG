import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './dialog';
import { Button } from './button';

/**
 * ConfirmDialog
 *
 * Exibe um modal de confirmação controlado, retornando a ação via callbacks.
 *
 * Connectors:
 * - Usado em WeeklyTimeGrid.jsx para confirmar disponibilização/cancelamento de consultas marketplace
 * - Pode ser reutilizado por outros fluxos que exigem confirmação explícita
 *
 * Hooks & Segurança:
 * - Bloqueia mudanças até o usuário escolher explicitamente OK
 * - Evita dependência de window.confirm (comportamento variável entre ambientes)
 */
const ConfirmDialog = ({
  open,
  title = 'Confirmação',
  message,
  confirmText = 'OK',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  onOpenChange
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange || (() => {})}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {message && (
            <DialogDescription>
              {message}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter>
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="outline" onClick={onCancel}>
              {cancelText}
            </Button>
            <Button className="bg-teal-600 text-white hover:bg-teal-700" onClick={onConfirm}>
              {confirmText}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;