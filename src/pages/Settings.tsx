import { useState, useEffect } from "react"
import { setApiKey, getApiKey } from "@/lib/aiConfig"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export default function Settings() {
  const [apiKey, setApiKeyValue] = useState("")
  const [isTesting, setIsTesting] = useState(false)
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

  const handleTestConnection = async () => {
    if (!apiKey) {
      toast({
        title: "Error",
        description: "Please enter an API Key first.",
        variant: "destructive",
      })
      return
    }

    setIsTesting(true)
    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" })
      
      const result = await model.generateContent("Respond with 'Connection successful'.")
      const response = await result.response
      
      if (response.text()) {
        toast({
          title: "Connection Successful",
          description: "Your Gemini API Key is working correctly.",
        })
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Gemini API.",
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
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
        <CardFooter className="flex gap-4">
          <Button onClick={handleSave} className="flex-1">Save Key</Button>
          <Button onClick={handleTestConnection} variant="secondary" className="flex-1" disabled={isTesting}>
            {isTesting ? "Testing..." : "Test Connection"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
