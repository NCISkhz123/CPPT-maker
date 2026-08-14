import { useState, useEffect } from "react"
import { setApiKey, getApiKey } from "@/lib/aiConfig"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export default function Settings() {
  const [apiKey, setApiKeyValue] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    const existingKey = getApiKey()
    if (existingKey) {
      setApiKeyValue(existingKey)
    }
  }, [])

  const handleSave = () => {
    setApiKey(apiKey)
    toast({
      title: "Success",
      description: "API Key saved successfully.",
    })
  }

  return (
    <div className="p-4 flex justify-center mt-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Configure your Gemini API key (Bring Your Own Key).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Gemini API Key</Label>
            <Input 
              id="apiKey" 
              type="password" 
              placeholder="Enter your Gemini API Key" 
              value={apiKey}
              onChange={(e) => setApiKeyValue(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave}>Save Key</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
