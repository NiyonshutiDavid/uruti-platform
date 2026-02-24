/**
 * StartupHub Module (API-Integrated)
 * Displays user's ventures with full CRUD operations
 * Uses reusable ListTemplate for displaying data
 */

import React, { useState } from 'react';
import { useVentures, useVentureActions } from '../../hooks/useApi';
import { ListTemplate, ColumnConfig, ActionConfig, FormTemplate, FormField } from '../templates/ModuleTemplates';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { useAuth } from '../../context/AuthContext';
import { Edit2, Trash2, Plus } from 'lucide-react';

export function StartupHubModuleAPI() {
  const { user } = useAuth();
  const { ventures, loading, error, refetch } = useVentures();
  const { createVenture, updateVenture, deleteVenture, loading: actionLoading, error: actionError } = useVentureActions();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVenture, setEditingVenture] = useState<any>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'funding'>('recent');

  // Sort ventures
  const sortedVentures = [...(ventures || [])].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else {
      return (b.funding_target || 0) - (a.funding_target || 0);
    }
  });

  // Column configurations for the table
  const columns: ColumnConfig<any>[] = [
    {
      key: 'title',
      label: 'Venture Name',
      width: '200px',
      render: (title, item) => (
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{item.industry || 'N/A'}</p>
        </div>
      ),
    },
    {
      key: 'stage',
      label: 'Stage',
      width: '100px',
      render: (stage) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {stage || 'Idea'}
        </span>
      ),
    },
    {
      key: 'pitch_score',
      label: 'Pitch Score',
      width: '100px',
      render: (score) => (
        <div className="flex items-center gap-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#76B947] h-2 rounded-full"
              style={{ width: `${(score || 0) * 10}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium">{score?.toFixed(1) || '0'}</span>
        </div>
      ),
    },
    {
      key: 'funding_target',
      label: 'Funding Target',
      type: 'number',
      width: '120px',
      render: (target) => (
        <span className="text-sm font-medium">
          {target ? `$${(target / 1000).toFixed(0)}k` : 'N/A'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      type: 'date',
      width: '100px',
    },
  ];

  // Action configurations
  const actions: ActionConfig<any>[] = [
    {
      label: 'Edit',
      icon: <Edit2 className="h-4 w-4" />,
      action: 'edit',
      variant: 'outline',
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      action: 'delete',
      variant: 'destructive',
    },
  ];

  // Form fields for creating/editing
  const formFields: FormField[] = [
    {
      name: 'title',
      label: 'Venture Name',
      type: 'text',
      required: true,
      placeholder: 'e.g., TechStart Rwanda',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Describe your venture...',
    },
    {
      name: 'industry',
      label: 'Industry',
      type: 'select',
      options: [
        { label: 'Technology', value: 'technology' },
        { label: 'Finance', value: 'finance' },
        { label: 'AgriTech', value: 'agritech' },
        { label: 'Healthcare', value: 'healthcare' },
        { label: 'Education', value: 'education' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'stage',
      label: 'Current Stage',
      type: 'select',
      options: [
        { label: 'Idea', value: 'idea' },
        { label: 'MVP', value: 'mvp' },
        { label: 'Seed', value: 'seed' },
        { label: 'Series A', value: 'series_a' },
        { label: 'Series B+', value: 'series_b' },
      ],
    },
    {
      name: 'funding_target',
      label: 'Funding Target ($)',
      type: 'number',
      placeholder: '50000',
    },
    {
      name: 'problem_statement',
      label: 'Problem Statement',
      type: 'textarea',
      placeholder: 'What problem does your venture solve?',
    },
    {
      name: 'solution',
      label: 'Solution',
      type: 'textarea',
      placeholder: 'How do you solve this problem?',
    },
    {
      name: 'target_market',
      label: 'Target Market',
      type: 'text',
      placeholder: 'e.g., East African SMEs',
    },
  ];

  const handleAction = async (action: string, item: any) => {
    if (action === 'edit') {
      setEditingVenture(item);
      setIsDialogOpen(true);
    } else if (action === 'delete') {
      if (confirm(`Delete "${item.title}"? This cannot be undone.`)) {
        try {
          await deleteVenture(item.id);
          refetch();
        } catch (err) {
          console.error('Error deleting venture:', err);
        }
      }
    }
  };

  const handleCreateVenture = async (formData: any) => {
    try {
      await createVenture(formData);
      refetch();
      setIsDialogOpen(false);
      setEditingVenture(null);
    } catch (err) {
      console.error('Error creating venture:', err);
    }
  };

  const handleUpdateVenture = async (formData: any) => {
    if (!editingVenture) return;
    try {
      await updateVenture(editingVenture.id, formData);
      refetch();
      setIsDialogOpen(false);
      setEditingVenture(null);
    } catch (err) {
      console.error('Error updating venture:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with sorting */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Ventures</h2>
          <p className="text-sm text-muted-foreground">Manage your startup projects</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border rounded-md text-sm bg-background"
          >
            <option value="recent">Most Recent</option>
            <option value="funding">Highest Funding Target</option>
          </select>
        </div>
      </div>

      {/* List Template */}
      <ListTemplate
        data={sortedVentures}
        loading={loading}
        error={error}
        title="Ventures"
        description={`You have ${sortedVentures.length} venture${sortedVentures.length !== 1 ? 's' : ''}`}
        columns={columns}
        actions={actions}
        onAction={handleAction}
        onAdd={() => {
          setEditingVenture(null);
          setIsDialogOpen(true);
        }}
        emptyMessage="No ventures yet. Create your first one!"
      />

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVenture ? 'Edit Venture' : 'Create New Venture'}</DialogTitle>
          </DialogHeader>
          <FormTemplate
            title=""
            description=""
            fields={formFields.map((field) => ({
              ...field,
              value: editingVenture?.[field.name] || '',
            }))}
            loading={actionLoading}
            onSubmit={editingVenture ? handleUpdateVenture : handleCreateVenture}
            submitLabel={editingVenture ? 'Update Venture' : 'Create Venture'}
            onCancel={() => {
              setIsDialogOpen(false);
              setEditingVenture(null);
            }}
          />
          {actionError && <p className="text-red-600 text-sm">{actionError.message}</p>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
