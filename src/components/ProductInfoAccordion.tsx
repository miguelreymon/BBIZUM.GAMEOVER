
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { Product } from '@/lib/products';

interface ProductInfoAccordionProps {
  productInfo: Product['productInfoAccordion'];
}

export default function ProductInfoAccordion({ productInfo }: ProductInfoAccordionProps) {
  if (!productInfo) return null;
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger className="text-lg font-medium">
          {productInfo.shipping.title}
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 text-muted-foreground text-left">
            <h4 className='font-semibold text-foreground'>{productInfo.shipping.freeShippingTitle}</h4>
            <p>
             {productInfo.shipping.freeShippingContent}
            </p>
            <h4 className='font-semibold text-foreground'>{productInfo.shipping.trackingTitle}</h4>
            <p>
              {productInfo.shipping.trackingContent}
            </p>
            <p>{productInfo.shipping.contactInfo}</p>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-8">
        <AccordionTrigger className="text-lg font-medium">
          {productInfo.warranty.title}
        </AccordionTrigger>
        <AccordionContent>
        <div className="space-y-4 text-muted-foreground text-left">
          <p>{productInfo.warranty.satisfactionGuarantee}</p>
          <p>
           {productInfo.warranty.returnsPolicy}
          </p>
          </div>
        </AccordionContent>
      </AccordionItem>
      {productInfo.extra && (
        <AccordionItem value="item-extra">
          <AccordionTrigger className="text-lg font-medium">
            {productInfo.extra.title}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 text-muted-foreground text-left">
              <p>{productInfo.extra.content}</p>
            </div>
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  );
}
