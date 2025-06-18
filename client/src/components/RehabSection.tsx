import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface RehabSectionProps {
  dealId: number;
  rehabItems: any[];
  totalBudget: number;
}

export function RehabSection({ dealId, rehabItems, totalBudget }: RehabSectionProps) {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({
    category: '',
    description: '',
    totalCost: ''
  });

  const queryClient = useQueryClient();

  const addRehabMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/deals/${dealId}/rehab`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deals', dealId.toString()] });
      setIsAddingItem(false);
      setNewItem({ category: '', description: '', totalCost: '' });
    }
  });

  const deleteRehabMutation = useMutation({
    mutationFn: (itemId: number) => apiRequest(`/api/deals/${dealId}/rehab/${itemId}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deals', dealId.toString()] });
    }
  });

  const handleAddItem = () => {
    if (newItem.category && newItem.description && newItem.totalCost) {
      addRehabMutation.mutate({
        category: newItem.category,
        description: newItem.description,
        totalCost: parseFloat(newItem.totalCost),
        bidStatus: 'estimated'
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Rehab Budget</CardTitle>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Budget</p>
            <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Existing rehab items */}
            {rehabItems.map((item, index) => (
              <div key={item.id || index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">{item.category}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(Number(item.totalCost))}</p>
                      <p className="text-xs text-muted-foreground capitalize">{item.bidStatus}</p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteRehabMutation.mutate(item.id)}
                  disabled={deleteRehabMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {/* Add new item form */}
            {isAddingItem && (
              <div className="p-4 border rounded-lg space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      placeholder="Kitchen, Flooring, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      placeholder="Full kitchen renovation"
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalCost">Total Cost</Label>
                    <Input
                      id="totalCost"
                      type="number"
                      value={newItem.totalCost}
                      onChange={(e) => setNewItem({ ...newItem, totalCost: e.target.value })}
                      placeholder="25000"
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleAddItem}
                    disabled={addRehabMutation.isPending}
                  >
                    Add Item
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingItem(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Add item button */}
            {!isAddingItem && (
              <Button
                variant="outline"
                onClick={() => setIsAddingItem(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Rehab Item
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}