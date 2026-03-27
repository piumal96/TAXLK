import { motion } from 'framer-motion';
import { User, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppContext } from '@/context/AppContext';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { state, dispatch } = useAppContext();
  const { profile } = state;

  const update = (field: string, value: any) => {
    dispatch({ type: 'SET_PROFILE', payload: { [field]: value } });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your personal information and preferences.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="shadow-elevated border-0">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={profile.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label>Occupation</Label>
                <Input
                  value={profile.occupation}
                  onChange={(e) => update('occupation', e.target.value)}
                  placeholder="Software Engineer"
                />
              </div>
              <div>
                <Label>Default Annual Income</Label>
                <Input
                  type="number"
                  value={profile.defaultIncome || ''}
                  onChange={(e) => update('defaultIncome', Number(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label>Input Preference</Label>
              <Select value={profile.inputPreference} onValueChange={(v) => update('inputPreference', v)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="gradient-primary border-0 text-primary-foreground hover:opacity-90"
              onClick={() => toast.success('Profile saved successfully!')}
            >
              <Save className="w-4 h-4 mr-2" /> Save Profile
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
