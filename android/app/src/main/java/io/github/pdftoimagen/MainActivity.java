package io.github.pdftoimagen;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    private static final String URL = "https://masterdrak.github.io/pdf-to-image/";
    private static final int FILE_CHOOSER_REQUEST = 1001;

    private ValueCallback<Uri[]> fileChooserCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        WebView webView      = findViewById(R.id.webview);
        ProgressBar progress = findViewById(R.id.progressBar);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        webView.setWebViewClient(new WebViewClient());

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int p) {
                progress.setVisibility(p < 100 ? View.VISIBLE : View.GONE);
                progress.setProgress(p);
            }

            @Override
            public boolean onShowFileChooser(WebView view,
                    ValueCallback<Uri[]> filePathCallback,
                    FileChooserParams fileChooserParams) {
                if (fileChooserCallback != null) {
                    fileChooserCallback.onReceiveValue(null);
                }
                fileChooserCallback = filePathCallback;

                Intent intent = fileChooserParams.createIntent();
                startActivityForResult(intent, FILE_CHOOSER_REQUEST);
                return true;
            }
        });

        webView.loadUrl(URL);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_REQUEST) {
            Uri[] result = resultCode == Activity.RESULT_OK
                    ? WebChromeClient.FileChooserParams.parseResult(resultCode, data)
                    : null;
            fileChooserCallback.onReceiveValue(result);
            fileChooserCallback = null;
        }
    }

    @Override
    public void onBackPressed() {
        WebView webView = findViewById(R.id.webview);
        if (webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }
}
