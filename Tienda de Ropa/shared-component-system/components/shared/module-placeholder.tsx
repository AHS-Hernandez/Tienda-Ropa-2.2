import { Construction } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface ModulePlaceholderProps {
  title: string
  description?: string
}

export function ModulePlaceholder({ title, description }: ModulePlaceholderProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <Construction className="h-10 w-10 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          {description ??
            "Módulo operativo en preparación. Los datos se cargarán desde vistas y procedimientos almacenados de SQL Server."}
        </p>
      </CardContent>
    </Card>
  )
}
