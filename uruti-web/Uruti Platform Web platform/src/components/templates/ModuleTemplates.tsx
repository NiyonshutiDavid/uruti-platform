/**
 * Reusable Module Template Components
 * These are flexible templates that accept data and configuration
 * Use these as base components for any module
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Loader2, AlertCircle } from 'lucide-react';

/**
 * Props for data display templates
 */
export interface TemplateProps<T> {
  data: T[] | null;
  loading: boolean;
  error: Error | null;
  title: string;
  description?: string;
  columns: ColumnConfig<T>[];
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onAction?: (action: string, item: T) => void;
  actions?: ActionConfig<T>[];
  emptyMessage?: string;
  filters?: FilterConfig[];
  onFilterChange?: (filters: any) => void;
}

export interface ColumnConfig<T> {
  key: keyof T;
  label: string;
  type?: 'text' | 'number' | 'date' | 'badge' | 'custom';
  render?: (value: any, item: T) => React.ReactNode;
  width?: string;
}

export interface ActionConfig<T> {
  label: string;
  icon?: React.ReactNode;
  action: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  condition?: (item: T) => boolean;
  className?: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'range';
  options?: { label: string; value: string }[];
}

/**
 * List/Table Template Component
 */
export function ListTemplate<T extends { id: number }>(props: TemplateProps<T>) {
  const {
    data,
    loading,
    error,
    title,
    description,
    columns,
    onAdd,
    onEdit,
    onDelete,
    onAction,
    actions = [],
    emptyMessage = 'No data available',
  } = props;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-900">
            <AlertCircle className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-red-800">{error.message}</CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {onAdd && <Button onClick={onAdd}>Add New</Button>}
        </CardHeader>
        <CardContent className="text-center py-12 text-muted-foreground">{emptyMessage}</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {onAdd && <Button onClick={onAdd}>Add New</Button>}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className="px-4 py-2 text-left font-semibold text-muted-foreground"
                    style={{ width: col.width }}
                  >
                    {col.label}
                  </th>
                ))}
                {(onEdit || onDelete || actions.length > 0) && (
                  <th className="px-4 py-2 text-left font-semibold text-muted-foreground">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} className="border-b hover:bg-muted/50 transition-colors">
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3" style={{ width: col.width }}>
                      {col.render
                        ? col.render(item[col.key], item)
                        : col.type === 'date'
                        ? new Date(item[col.key] as any).toLocaleDateString()
                        : String(item[col.key])}
                    </td>
                  ))}
                  {(onEdit || onDelete || actions.length > 0) && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {actions.map((actionConfig) => (
                          (!actionConfig.condition || actionConfig.condition(item)) && (
                            <Button
                              key={actionConfig.action}
                              variant={actionConfig.variant || 'outline'}
                              size="sm"
                              onClick={() => onAction?.(actionConfig.action, item)}
                              className={actionConfig.className}
                            >
                              {actionConfig.icon && <span className="mr-1">{actionConfig.icon}</span>}
                              {actionConfig.label}
                            </Button>
                          )
                        ))}
                        {onEdit && (
                          <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
                            Edit
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDelete(item)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Grid Template Component (for cards)
 */
export interface GridTemplateProps<T> extends Omit<TemplateProps<T>, 'columns'> {
  renderCard: (item: T) => React.ReactNode;
  columns?: number;
}

export function GridTemplate<T extends { id: number }>(props: GridTemplateProps<T>) {
  const { data, loading, error, title, description, renderCard, columns = 3, onAdd, emptyMessage = 'No data available' } = props;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-900">
            <AlertCircle className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-red-800">{error.message}</CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {onAdd && <Button onClick={onAdd}>Add New</Button>}
        </CardHeader>
        <CardContent className="text-center py-12 text-muted-foreground">{emptyMessage}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {onAdd && <Button onClick={onAdd}>Add New</Button>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(300px, 1fr))`, gap: '1rem' }}>
        {data.map((item) => (
          <div key={item.id}>{renderCard(item)}</div>
        ))}
      </div>
    </div>
  );
}

/**
 * Stats Template Component (for dashboards)
 */
export interface StatItem {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: { value: number; trend: 'up' | 'down' };
  color?: string;
}

export interface StatsTemplateProps {
  title: string;
  stats: StatItem[];
  loading?: boolean;
  error?: Error | null;
  columns?: number;
}

export function StatsTemplate({ title, stats, loading, error, columns = 4 }: StatsTemplateProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-900">Error loading stats</CardTitle>
        </CardHeader>
        <CardContent className="text-red-800">{error.message}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${200}px, 1fr))`, gap: '1rem' }}>
        {stats.map((stat, idx) => (
          <Card key={idx}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                  {stat.change && (
                    <p
                      className={`text-xs mt-2 ${
                        stat.change.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {stat.change.trend === 'up' ? '↑' : '↓'} {stat.change.value}%
                    </p>
                  )}
                </div>
                {stat.icon && <div className="text-3xl opacity-50">{stat.icon}</div>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Form Template Component
 */
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  value?: any;
}

export interface FormTemplateProps {
  title: string;
  description?: string;
  fields: FormField[];
  loading?: boolean;
  onSubmit: (data: any) => void | Promise<void>;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
}

export function FormTemplate({
  title,
  description,
  fields,
  loading,
  onSubmit,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  onCancel,
}: FormTemplateProps) {
  const [formData, setFormData] = React.useState<any>(
    fields.reduce((acc, field) => ({ ...acc, [field.name]: field.value || '' }), {})
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <label htmlFor={field.name} className="text-sm font-medium">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {field.type === 'textarea' ? (
                <textarea
                  id={field.name}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  required={field.required}
                  className="w-full px-3 py-2 border rounded-md text-sm border-input bg-background"
                  rows={4}
                />
              ) : field.type === 'select' ? (
                <select
                  id={field.name}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  required={field.required}
                  className="w-full px-3 py-2 border rounded-md text-sm border-input bg-background"
                >
                  <option value="">Select {field.label}</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <input
                  type="checkbox"
                  id={field.name}
                  name={field.name}
                  checked={formData[field.name]}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
              ) : (
                <input
                  type={field.type}
                  id={field.name}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  required={field.required}
                  className="w-full px-3 py-2 border rounded-md text-sm border-input bg-background"
                />
              )}
            </div>
          ))}

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting || loading}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {submitLabel}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                {cancelLabel}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
