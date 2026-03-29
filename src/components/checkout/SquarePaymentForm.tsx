
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { processOrderAction } from '@/app/actions';
import { Loader2, AlertTriangle, Info, CreditCard, Truck, Smartphone } from 'lucide-react';
import type { Card } from '@square/web-payments-sdk-types';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { PaymentMethod } from '@/app/checkout/page';

const formSchema = z.object({
  email: z.string().email({ message: 'Correo electrónico inválido.' }),
  phone: z.string().optional(),
  firstName: z.string().min(1, 'El nombre es obligatorio.'),
  address: z.string().min(1, 'La dirección es obligatoria.'),
  apartment: z.string().optional(),
  city: z.string().min(1, 'La ciudad es obligatoria.'),
  postalCode: z.string().min(1, 'El código postal es obligatorio.'),
  country: z.string().min(1, 'El país es obligatorio.'),
});

interface SquarePaymentFormProps {
  appId: string;
  locationId: string;
  totalAmount: number;
  isSdkLoaded: boolean;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  isDiscountApplied: boolean;
}

export default function SquarePaymentForm({ 
    appId, 
    locationId, 
    totalAmount, 
    isSdkLoaded,
    paymentMethod,
    setPaymentMethod,
    isDiscountApplied
}: SquarePaymentFormProps) {
  const { cartItems, clearCartAndOrder } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  
  const cardRef = useRef<Card | null>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  
  const isFreeOrder = totalAmount <= 0;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      phone: '',
      firstName: '',
      address: '',
      apartment: '',
      city: '',
      postalCode: '',
      country: 'España',
    },
  });
  
  const destroyCard = useCallback(async () => {
    if (cardRef.current) {
        await cardRef.current.destroy();
        cardRef.current = null;
    }
    if (cardContainerRef.current) {
        cardContainerRef.current.innerHTML = '';
    }
    initialized.current = false;
  }, []);
  
  useEffect(() => {
    const initializeCard = async () => {
      // Card payment disabled by technical issues
      return;
      /*
      if (paymentMethod !== 'card' || isFreeOrder || !isSdkLoaded || !cardContainerRef.current) {
        if (cardRef.current) {
            await destroyCard();
        }
        return;
      }
      */
      
      if (initialized.current) {
        return;
      }
      
      if (!(window as any).Square) {
          setSdkError("El objeto Square no está disponible. Por favor, refresca la página.");
          return;
      }

      initialized.current = true;
    
      try {
        const payments = (window as any).Square.payments(appId, locationId);
        const card = await payments.card();
        if (cardContainerRef.current) {
          await card.attach(cardContainerRef.current);
          cardRef.current = card;
        }
      } catch (error: any) {
        console.error("Error inicializando Square Card:", error);
        setSdkError(error.message || "Ocurrió un error inesperado al inicializar el método de pago.");
        initialized.current = false;
      }
    };

    initializeCard();

  }, [appId, locationId, isFreeOrder, isSdkLoaded, destroyCard, paymentMethod]);

  async function handlePayment(values: z.infer<typeof formSchema>) {
    setIsProcessing(true);
    
    const orderPayload = {
        customer: {
            ...values,
            phone: values.phone || undefined,
        },
        cartItems: cartItems,
        total: totalAmount,
    };
    
    try {
        let sourceId: string | undefined = undefined;

        if (paymentMethod === 'card' && !isFreeOrder) {
            if (!cardRef.current) {
                throw new Error('El formulario de pago no está listo. Por favor, espera un momento o refresca la página.');
            }
            const tokenizeResult = await cardRef.current.tokenize();
            if (tokenizeResult.status !== 'OK' || !tokenizeResult.token) {
                throw new Error('No se pudo validar la tarjeta. Revisa los datos introducidos.');
            }
            sourceId = tokenizeResult.token;
        } else {
            sourceId = paymentMethod;
        }

        const result = await processOrderAction({
            payment: {
                sourceId,
                currency: 'EUR',
            },
            order: orderPayload,
        });

        if (result.success && result.orderId) {
            const orderDetails = {
                customer: orderPayload.customer,
                orderId: result.orderId,
                paymentMethod: paymentMethod,
                total: totalAmount,
            };
            clearCartAndOrder(orderDetails);
            toast({ title: '¡Pedido realizado!', description: 'Gracias por tu compra. Te estamos redirigiendo...' });
            router.push('/thank-you');
        } else {
            throw new Error(result.error || 'No se pudo procesar el pedido.');
        }

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error en el Pedido',
        description: error.message,
      });
    } finally {
      setIsProcessing(false);
    }
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handlePayment)} className="space-y-8">
        <div className="space-y-4">
            <h2 className="text-xl font-bold">Información de Contacto</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Correo Electrónico</FormLabel>
                        <FormControl>
                        <Input placeholder="tu@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className='flex items-center gap-2'>
                            Teléfono
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Aconsejable para que el repartidor pueda contactarte si hay algún problema.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold">Dirección de Envío</h2>
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre y Apellidos</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Input placeholder="" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ciudad</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código Postal</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>País</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        {!isFreeOrder && (
            <div className="space-y-4">
                <h2 className="text-xl font-bold">Método de Pago</h2>
                 <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                    className="grid grid-cols-1 gap-4"
                >
                    <Label
                        htmlFor="card-payment"
                        className={cn(
                        "flex flex-col rounded-lg border-2 p-4 cursor-not-allowed opacity-60",
                        {
                            'border-primary ring-2 ring-primary': paymentMethod === 'card',
                            'border-muted': paymentMethod !== 'card',
                        }
                        )}
                    >
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <RadioGroupItem value="card" id="card-payment" disabled />
                                <div className="flex items-center gap-2">
                                  <CreditCard className="w-5 h-5" />
                                  <span className="font-semibold">Pago con Tarjeta</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 text-xs text-destructive font-medium">
                            No disponible por problemas técnicos, se resolverá cuanto antes.
                        </div>
                        {/* Card payment disabled */}
                        {false && (
                        <div className={cn("mt-4 transition-all duration-300", paymentMethod === 'card' ? 'max-h-screen' : 'max-h-0 overflow-hidden')}>
                           {sdkError ? (
                                <div className="text-destructive text-center p-4 border border-destructive/50 rounded-md flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5"/>
                                <p className="text-sm">
                                    {sdkError} Por favor, refresca la página.
                                </p>
                                </div>
                            ) : (
                                <div className="relative" style={{ minHeight: '100px' }}>
                                    <div 
                                        ref={cardContainerRef} 
                                        id="card-container"
                                    />
                                </div>
                            )}
                        </div>)}
                    </Label>
                    {/* COD payment hidden as requested */}
                    <Label
                        htmlFor="bizum-payment"
                        className={cn(
                        "flex items-center justify-between rounded-lg border-2 p-4 cursor-pointer",
                        {
                            'border-primary ring-2 ring-primary': paymentMethod === 'bizum',
                            'border-muted hover:border-muted-foreground': paymentMethod !== 'bizum',
                        }
                        )}
                    >
                        <div className="flex items-center gap-3">
                             <RadioGroupItem value="bizum" id="bizum-payment" />
                            <div className="flex items-center gap-2">
                                <Smartphone className="w-5 h-5" />
                                <span className="font-semibold">Pago con Bizum</span>
                            </div>
                        </div>
                         <span className="font-bold text-green-600">-10% EXTRA</span>
                    </Label>
                </RadioGroup>
                {/* COD payment logic removed */}
                {paymentMethod === 'bizum' && (
                    <div className="text-sm text-muted-foreground bg-secondary p-3 rounded-md border-l-4 border-primary">
                        <div className="flex items-center gap-2 mb-2 text-foreground font-bold">
                            <Info className="w-4 h-4" />
                            <span>Instrucciones de Pago</span>
                        </div>
                        Una vez confirmado el pedido, deberás realizar un Bizum al número <strong className="text-foreground">680414307</strong>. 
                        <br/><br/>
                        <strong className="text-foreground">Importante:</strong> En el concepto del Bizum, indica tu <strong className="text-foreground">Nombre y Apellidos</strong> o el <strong className="text-foreground">Número de Pedido</strong> que aparecerá en la siguiente pantalla.
                        <br/><br/>
                        Una vez verificado el pago, procederemos al envío inmediato de tu consola.
                    </div>
                )}
            </div>
        )}

        <Button 
          type="submit" 
          className="w-full bg-black text-white hover:bg-black/90" 
          size="lg" 
          disabled={isProcessing || paymentMethod === 'card'}
        >
          {isProcessing ? (
            <Loader2 className="animate-spin" />
          ) : isFreeOrder ? (
            'Confirmar Pedido'
          ) : paymentMethod === 'bizum' ? (
            `Confirmar Pedido (${totalAmount.toFixed(2)}€)`
          ) : (
            `Pagar ${totalAmount.toFixed(2)}€`
          )}
        </Button>
      </form>
    </Form>
  );
}
