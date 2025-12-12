import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import calculatorService, { CalculatorResult } from '../services/calculator';
import { cn } from '../lib/utils';

const SpinnerIcon = ({ large, isTextWhite = true }: { large?: boolean, isTextWhite?: boolean }) => <svg className={`animate-spin ${large ? 'h-10 w-10' : 'h-5 w-5'} ${isTextWhite ? 'text-white' : 'text-primary-600 dark:text-primary-400'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
const CalculatorIcon = ({ large }: { large?: boolean }) => <svg xmlns="http://www.w3.org/2000/svg" className={`${large ? 'h-16 w-16' : 'h-6 w-6'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 7h6m0 0v6m0-6L9 13" /><path d="M3 6.2C3 5.0799 3 4.51984 3.21799 4.09202C3.40973 3.71569 3.71569 3.40973 4.09202 3.21799C4.51984 3 5.0799 3 6.2 3H17.8C18.9201 3 19.4802 3 19.908 3.21799C20.2843 3.40973 20.5903 3.71569 20.782 4.09202C21 4.51984 21 5.0799 21 6.2V17.8C21 18.9201 21 19.4802 20.782 19.908C20.5903 20.2843 20.2843 20.5903 19.908 20.782C19.4802 21 18.9201 21 17.8 21H6.2C5.0799 21 4.51984 21 4.09202 20.782C3.71569 20.5903 3.40973 20.2843 3.21799 19.908C3 19.4802 3 18.9201 3 17.8V6.2Z" strokeWidth={1} /></svg>;

// Icons for shipping lines
const ShipIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25" /></svg>;
const ClockIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CheckCircleIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const PriceCalculator = () => {
    // Form state
    const [params, setParams] = useState({
        portOrigin: '',
        containerType: '',
        cargoWeight: '',
        cargoReadyDate: '',
        cargoCategory: '',
    });

    // Dropdown options from API
    const [availablePorts, setAvailablePorts] = useState<string[]>([]);
    const [availableContainerTypes, setAvailableContainerTypes] = useState<string[]>([]);
    const [availableWeightRanges, setAvailableWeightRanges] = useState<string[]>([]);

    const [result, setResult] = useState<CalculatorResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [selectedOffer, setSelectedOffer] = useState<number>(0);

    // Load dropdown options on mount
    useEffect(() => {
        const loadOptions = async () => {
            try {
                const [ports, types, weights] = await Promise.all([
                    calculatorService.getAvailablePorts(),
                    calculatorService.getAvailableContainerTypes(),
                    calculatorService.getAvailableWeightRanges(),
                ]);

                setAvailablePorts(ports);
                setAvailableContainerTypes(types);
                setAvailableWeightRanges(weights);

                // Set default values
                if (ports.length > 0) setParams(prev => ({ ...prev, portOrigin: ports[0] }));
                if (types.length > 0) setParams(prev => ({ ...prev, containerType: types[0] }));
                if (weights.length > 0) setParams(prev => ({ ...prev, cargoWeight: weights[0] }));
            } catch (err: any) {
                console.error('Failed to load calculator options:', err);
            }
        };

        loadOptions();
    }, []);

    const handleCalculate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setResult(null);
        setError('');
        setSelectedOffer(0);

        try {
            const calculatorResult = await calculatorService.calculatePrices({
                portOrigin: params.portOrigin,
                containerType: params.containerType,
                cargoWeight: params.cargoWeight,
                cargoReadyDate: params.cargoReadyDate,
                cargoCategory: params.cargoCategory,
            });

            setResult(calculatorResult);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Flexport-style form components
    const FormField = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
        <div className="space-y-1.5">
            <label className="block text-sm font-medium text-primary-800 dark:text-neutral-200">{label}</label>
            {children}
            {hint && <p className="text-xs text-neutral-400">{hint}</p>}
        </div>
    );

    const Select = ({ ...props }) => (
        <select
            {...props}
            className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all appearance-none cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7684' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em', paddingRight: '2.5rem' }}
        />
    );

    const Input = ({ ...props }) => (
        <input
            {...props}
            className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all"
        />
    );

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-primary-800 dark:text-white font-heading">
                    Calculator de Prețuri
                </h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    Obțineți cele mai bune oferte de la toate liniile maritime
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Calculator Form */}
                <div className="lg:col-span-4">
                    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-card border border-neutral-200/50 dark:border-neutral-700/50 p-6 sticky top-24">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-primary-800 flex items-center justify-center">
                                <CalculatorIcon />
                            </div>
                            <div>
                                <h3 className="font-semibold text-primary-800 dark:text-white">Detalii Transport</h3>
                                <p className="text-xs text-neutral-400">Completați toate câmpurile</p>
                            </div>
                        </div>

                        <form onSubmit={handleCalculate} className="space-y-5">
                            <FormField label="Port Origine">
                                <Select
                                    value={params.portOrigin}
                                    onChange={e => setParams({ ...params, portOrigin: e.target.value })}
                                    required
                                >
                                    {availablePorts.map(p => <option key={p} value={p}>{p}</option>)}
                                </Select>
                            </FormField>

                            <FormField label="Port Destinație" hint="Toate expediațiile ajung la Constanța">
                                <Input value="Constanța, România" disabled className="bg-neutral-50 dark:bg-neutral-700/50" />
                            </FormField>

                            <FormField label="Tip Container">
                                <Select
                                    value={params.containerType}
                                    onChange={e => setParams({ ...params, containerType: e.target.value })}
                                    required
                                >
                                    {availableContainerTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </Select>
                            </FormField>

                            <FormField label="Greutate Marfă">
                                <Select
                                    value={params.cargoWeight}
                                    onChange={e => setParams({ ...params, cargoWeight: e.target.value })}
                                    required
                                >
                                    {availableWeightRanges.map(w => <option key={w} value={w}>{w}</option>)}
                                </Select>
                            </FormField>

                            <FormField label="Categorie Marfă (Cod HS)" hint="Cod armonizat pentru taxe vamale">
                                <Input
                                    type="text"
                                    placeholder="Ex: 9403.30"
                                    value={params.cargoCategory}
                                    onChange={e => setParams({ ...params, cargoCategory: e.target.value })}
                                    required
                                />
                            </FormField>

                            <FormField label="Data Pregătire Marfă">
                                <Input
                                    type="date"
                                    value={params.cargoReadyDate}
                                    onChange={e => setParams({ ...params, cargoReadyDate: e.target.value })}
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </FormField>

                            {error && (
                                <div className="p-3 bg-error-50 dark:bg-error-500/20 border border-error-200 dark:border-error-500/30 rounded-lg">
                                    <p className="text-sm text-error-700 dark:text-error-400">{error}</p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                variant="accent"
                                disabled={isLoading}
                                loading={isLoading}
                                className="w-full"
                                size="lg"
                            >
                                {isLoading ? 'Se calculează...' : 'Calculează Prețuri'}
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Results Section */}
                <div className="lg:col-span-8">
                    {isLoading && (
                        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-card border border-neutral-200/50 dark:border-neutral-700/50 p-12 flex flex-col items-center justify-center min-h-[500px]">
                            <SpinnerIcon large isTextWhite={false} />
                            <p className="mt-4 text-neutral-500 dark:text-neutral-400 font-medium">Se calculează oferte...</p>
                            <p className="text-sm text-neutral-400 mt-1">Analizăm toate liniile maritime pentru cele mai bune prețuri</p>
                        </div>
                    )}

                    {!isLoading && !result && (
                        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-card border border-neutral-200/50 dark:border-neutral-700/50 p-12 flex flex-col items-center justify-center min-h-[500px]">
                            <div className="w-20 h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center mb-4">
                                <CalculatorIcon large />
                            </div>
                            <h3 className="text-lg font-semibold text-primary-800 dark:text-white mb-2">Gata pentru calcul</h3>
                            <p className="text-neutral-500 dark:text-neutral-400 text-center max-w-md">
                                Completați formularul pentru a vedea cele mai bune 5 oferte de la toate liniile maritime disponibile.
                            </p>
                        </div>
                    )}

                    {result && (
                        <div className="space-y-5">
                            {/* Info Banner */}
                            <div className="bg-primary-800 text-white rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm opacity-80">Curs USD → MDL</p>
                                    <p className="text-2xl font-bold">{result.exchangeRate.toFixed(2)} MDL</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm opacity-80">Calculat la</p>
                                    <p className="font-medium">{new Date(result.calculatedAt).toLocaleString('ro-RO')}</p>
                                </div>
                            </div>

                            {/* Offer Cards */}
                            <div className="grid gap-4">
                                {result.offers.map((offer, index) => (
                                    <div
                                        key={offer.rank}
                                        onClick={() => setSelectedOffer(index)}
                                        className={cn(
                                            "bg-white dark:bg-neutral-800 rounded-xl border-2 p-5 cursor-pointer transition-all duration-300",
                                            selectedOffer === index
                                                ? "border-accent-500 shadow-lg shadow-accent-500/10"
                                                : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            {/* Left: Rank & Shipping Line */}
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg",
                                                    offer.rank === 1
                                                        ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white"
                                                        : offer.rank === 2
                                                            ? "bg-gradient-to-br from-neutral-300 to-neutral-400 text-white"
                                                            : offer.rank === 3
                                                                ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white"
                                                                : "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
                                                )}>
                                                    #{offer.rank}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-lg text-primary-800 dark:text-white">{offer.shippingLine}</h4>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="flex items-center gap-1 text-sm text-neutral-500">
                                                            <ClockIcon />
                                                            {offer.estimatedTransitDays} zile
                                                        </span>
                                                        <span className={cn(
                                                            "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium",
                                                            offer.availability === 'AVAILABLE'
                                                                ? 'bg-success-50 text-success-700 dark:bg-success-500/20 dark:text-success-500'
                                                                : offer.availability === 'LIMITED'
                                                                    ? 'bg-warning-50 text-warning-700 dark:bg-warning-500/20 dark:text-warning-500'
                                                                    : 'bg-error-50 text-error-700 dark:bg-error-500/20 dark:text-error-500'
                                                        )}>
                                                            <CheckCircleIcon />
                                                            {offer.availability === 'AVAILABLE' ? 'Disponibil' : offer.availability === 'LIMITED' ? 'Limitat' : 'Indisponibil'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: Price */}
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-accent-500">${offer.totalPriceUSD.toFixed(0)}</p>
                                                <p className="text-sm text-neutral-400">{offer.totalPriceMDL.toFixed(0)} MDL</p>
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        {selectedOffer === index && (
                                            <div className="mt-5 pt-5 border-t border-neutral-200 dark:border-neutral-700 animate-fade-in">
                                                <h5 className="text-sm font-semibold text-primary-800 dark:text-white mb-3">Defalcare Costuri</h5>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                    <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-3">
                                                        <p className="text-xs text-neutral-400 mb-1">Tarif Maritim</p>
                                                        <p className="font-semibold text-primary-800 dark:text-white">${offer.freightPrice.toFixed(2)}</p>
                                                    </div>
                                                    <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-3">
                                                        <p className="text-xs text-neutral-400 mb-1">Taxe Portuare</p>
                                                        <p className="font-semibold text-primary-800 dark:text-white">${offer.portTaxes.toFixed(2)}</p>
                                                    </div>
                                                    <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-3">
                                                        <p className="text-xs text-neutral-400 mb-1">Taxe Vamale</p>
                                                        <p className="font-semibold text-primary-800 dark:text-white">${offer.customsTaxes.toFixed(2)}</p>
                                                    </div>
                                                    <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-3">
                                                        <p className="text-xs text-neutral-400 mb-1">Transport Terestru</p>
                                                        <p className="font-semibold text-primary-800 dark:text-white">${offer.terrestrialTransport.toFixed(2)}</p>
                                                    </div>
                                                    <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-3">
                                                        <p className="text-xs text-neutral-400 mb-1">Comision</p>
                                                        <p className="font-semibold text-primary-800 dark:text-white">${offer.commission.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                                <Button variant="accent" className="w-full mt-4">
                                                    Selectează Această Ofertă
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <p className="text-xs text-neutral-400 text-center py-2">
                                * Prețurile sunt orientative și pot varia în funcție de disponibilitate și condiții speciale.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PriceCalculator;
