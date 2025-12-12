
import React, { useState } from 'react';
import { User } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { Switch } from './ui/Switch';
import { useToast } from './ui/Toast';

const UserProfile = ({ user }: { user: User }) => {
    const { addToast } = useToast();

    // Mock states for form inputs
    const [profile, setProfile] = useState({
        firstName: user.name.split(' ')[0],
        lastName: user.name.split(' ').slice(1).join(' '),
        phone: '+373 69 123 456'
    });
    const [notifications, setNotifications] = useState({
        email: true,
        sms: false,
        newsletter: true
    });

    const handleProfileSave = (e: React.FormEvent) => {
        e.preventDefault();
        addToast('Profilul a fost actualizat cu succes!', 'success');
    };
    
    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        addToast('Parola a fost schimbată cu succes!', 'success');
    };

    const handleNotificationsSave = (e: React.FormEvent) => {
        e.preventDefault();
        addToast('Preferințele de notificare au fost salvate!', 'success');
    };

    return (
        <div className="space-y-5">
             <div>
                <h3 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-100">Profilul Meu</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Gestionează informațiile contului tău.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <Card className="p-6 text-center">
                        <div className="relative inline-block">
                            <div className="h-24 w-24 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-300 text-4xl font-bold">
                                {user.name.slice(0, 2).toUpperCase()}
                            </div>
                        </div>
                        <h2 className="mt-4 text-2xl font-bold">{user.name}</h2>
                        <p className="text-neutral-500 dark:text-neutral-400">{user.email}</p>
                        <Badge variant="blue" className="mt-2">{user.role}</Badge>
                        <Button variant="secondary" size="sm" className="w-full mt-6" onClick={() => addToast('Funcționalitate neimplementată.')}>Editează Profilul</Button>
                        <div className="text-left mt-6 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-neutral-500">Status Cont:</span>
                                <Badge variant="green">Activ</Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-neutral-500">Membru din:</span>
                                <span className="font-medium">20 Ian, 2024</span>
                            </div>
                        </div>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Tabs defaultValue="settings">
                        <TabsList>
                            <TabsTrigger value="settings">Setări Profil</TabsTrigger>
                            <TabsTrigger value="security">Securitate</TabsTrigger>
                            <TabsTrigger value="notifications">Notificări</TabsTrigger>
                        </TabsList>
                        <TabsContent value="settings">
                            <Card>
                                <form onSubmit={handleProfileSave} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium">Nume</label>
                                            <Input value={profile.firstName} onChange={(e) => setProfile({...profile, firstName: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Prenume</label>
                                            <Input value={profile.lastName} onChange={(e) => setProfile({...profile, lastName: e.target.value})} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Email</label>
                                        <Input value={user.email} disabled />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Număr de Telefon</label>
                                        <Input value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} />
                                    </div>
                                    <div className="text-right">
                                        <Button type="submit">Salvează Modificările</Button>
                                    </div>
                                </form>
                            </Card>
                        </TabsContent>
                        <TabsContent value="security">
                             <Card>
                                <form onSubmit={handlePasswordChange} className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium">Parola Curentă</label>
                                        <Input type="password" placeholder="••••••••" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Parola Nouă</label>
                                        <Input type="password" placeholder="••••••••" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Confirmă Parola Nouă</label>
                                        <Input type="password" placeholder="••••••••" />
                                    </div>
                                    <div className="text-right">
                                        <Button type="submit">Schimbă Parola</Button>
                                    </div>
                                </form>
                                <div className="border-t my-6"></div>
                                <div>
                                    <h4 className="text-base font-semibold mb-2">Autentificare cu 2 Factori (2FA)</h4>
                                    <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-sm">Activează 2FA</p>
                                            <p className="text-xs text-neutral-500">Adaugă un strat suplimentar de securitate contului tău.</p>
                                        </div>
                                        <Switch checked={false} onCheckedChange={() => addToast('Funcționalitate neimplementată.')} />
                                    </div>
                                </div>
                            </Card>
                        </TabsContent>
                        <TabsContent value="notifications">
                             <Card>
                                <form onSubmit={handleNotificationsSave} className="space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                                        <div>
                                            <p className="font-medium text-sm">Alerte pe Email</p>
                                            <p className="text-xs text-neutral-500">Primește notificări importante direct pe email.</p>
                                        </div>
                                        <Switch checked={notifications.email} onCheckedChange={(c) => setNotifications({...notifications, email: c})} />
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                                        <div>
                                            <p className="font-medium text-sm">Notificări SMS</p>
                                            <p className="text-xs text-neutral-500">Primește alerte urgente prin SMS.</p>
                                        </div>
                                        <Switch checked={notifications.sms} onCheckedChange={(c) => setNotifications({...notifications, sms: c})} />
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                                        <div>
                                            <p className="font-medium text-sm">Newsletter Săptămânal</p>
                                            <p className="text-xs text-neutral-500">Primește un sumar al activității și noutăți.</p>
                                        </div>
                                        <Switch checked={notifications.newsletter} onCheckedChange={(c) => setNotifications({...notifications, newsletter: c})} />
                                    </div>
                                    <div className="text-right pt-2">
                                        <Button type="submit">Salvează Preferințele</Button>
                                    </div>
                                </form>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
