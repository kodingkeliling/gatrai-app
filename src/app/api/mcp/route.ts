import { NextRequest, NextResponse } from "next/server";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { validateMcpAuth } from "@/lib/mcp-auth";
import { executeTool, TOOLS_LIST, PROTECTED_TOOLS } from "@/lib/mcp-logic";

export const runtime = "nodejs";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, mcp-protocol-version",
    "Access-Control-Expose-Headers": "Link"
};

export async function GET(req: NextRequest) {
    const accept = req.headers.get("accept") || "";
    const origin = new URL(req.url).origin;

    if (!accept.includes("text/event-stream")) {
        return new NextResponse("GatrAI MCP Server (Stateless) is active.", {
            status: 200,
            headers: {
                "Content-Type": "text/plain",
                ...corsHeaders
            }
        });
    }

    const server = new Server({
        name: "GatrAI MCP Server",
        version: "1.0.0"
    }, {
        capabilities: {
            tools: {}
        }
    });

    const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined
    });

    await server.connect(transport);

    const response = await transport.handleRequest(req);
    
    // Add cors and custom headers
    response.headers.set("Link", `<${origin}/.well-known/oauth-protected-resource>; rel="blocked-by-auth"`);
    response.headers.set("X-Accel-Buffering", "no");
    Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
    });

    return response;
}

export async function POST(req: NextRequest) {
    const origin = new URL(req.url).origin;
    
    // Clone request body to parse and check for Lazy Auth
    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: corsHeaders });
    }

    const method = body.method;
    const authHeader = req.headers.get("Authorization");

    // Check if user is authenticated
    const userId = await validateMcpAuth(authHeader);

    // Lazy Auth Check
    if (method === "tools/call") {
        const toolName = body.params?.name;
        if (PROTECTED_TOOLS.includes(toolName)) {
            if (!userId) {
                // Return 401 with authentication headers and custom JSON-RPC error
                return NextResponse.json(
                    {
                        jsonrpc: "2.0",
                        id: body.id ?? null,
                        error: {
                            code: -32001,
                            message: "Unauthorized. Please authenticate.",
                            data: {
                                login_url: `${origin}/oauth/authorize`,
                                oauth_metadata: {
                                    issuer: `${origin}/`,
                                    authorization_endpoint: `${origin}/oauth/authorize`,
                                    token_endpoint: `${origin}/api/oauth/token`
                                }
                            }
                        }
                    },
                    {
                        status: 401,
                        headers: {
                            ...corsHeaders,
                            "WWW-Authenticate": `Bearer realm="GatrAI", resource_metadata="${origin}/.well-known/oauth-protected-resource"`
                        }
                    }
                );
            }
        }
    }

    // Process using the MCP SDK
    const server = new Server({
        name: "GatrAI MCP Server",
        version: "1.0.0"
    }, {
        capabilities: {
            tools: {}
        }
    });

    // Register tool list schema handler
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
            tools: TOOLS_LIST
        };
    });

    // Register Call tool handler
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        try {
            return await executeTool(request.params.name, request.params.arguments, userId);
        } catch (error: any) {
            return {
                isError: true,
                content: [{ type: "text", text: error.message || "Unknown error occurred" }]
            };
        }
    });

    const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined
    });

    await server.connect(transport);

    // Reconstruct standard Web Request for transport
    const clonedReq = new Request(req.url, {
        method: "POST",
        headers: req.headers,
        body: JSON.stringify(body)
    });

    const response = await transport.handleRequest(clonedReq);
    
    // Add CORS headers to the response
    Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
    });

    return response;
}

export async function OPTIONS() {
    return new NextResponse(null, {
        headers: corsHeaders
    });
}
